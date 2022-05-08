var mackieElements = require('./mackie_c4_elements.js');

var PushEncoder = mackieElements.PushEncoder
var Button = mackieElements.Button


/**
 * MackieC4 class
 *
 * @constructor
 * @param {object} context
 * @param {string} sw_rev
 */
 function MackieC4(context, sw_rev) {

    console.log("Mackie C4 Initialization");
  
    // Mackie ID for system exclusive messages - bytes 1 to 3
    this.mackieId = [0x00, 0x00, 0x66]
  
    // Hardware models - byte 4
    // Although this driver will only use mcuC4ModelId
    // It shouldn't be too hard to expand for the other models as well
    this.mcuModelId   = [0x10]
    this.mcuXTModelId = [0x11]
    this.mcuC4ModelId = [0x17]
  
    // System Exclusive Message Type - byte 5
    this.deviceQueryId                = [0x00]
    this.hostConnectionQueryId        = [0x01]
    this.hostConnectionReplyId        = [0x02]
    this.hostConnectionConfirmationId = [0x03]
    this.hostConnectionErrorId        = [0x04]
    this.firmwareVersionRequestId     = [0x13]
    this.firmwareVersionReplyId       = [0x14]
    this.resetFadersMinimum           = [0x61]
    this.ledsOff                      = [0x62]
    this.goOffline                    = [0x63]
    this.transportButtonClick         = [0x0A]
    this.ledBackLightSaver            = [0x0B]
    this.touchlessMovableFader        = [0x0C]
    this.faderTouchSensitivity        = [0x0E]
    this.updateLcdDisplay             = [0x12]
    this.updateTimecodeDisplay        = [0x10]
    this.updateAssignmentDisplay      = [0x11]
    this.channelMeterMode             = [0x20]
    this.globalMeterMode              = [0x21]
    this.ledStrip0                    = [0x30]
    this.ledStrip1                    = [0x31]
    this.ledStrip2                    = [0x32]
    this.ledStrip3                    = [0x33]
    
    // Mackie C4
    this.sysExStart = [0xF0]
    this.modelId = this.mcuC4ModelId
    this.sysExMsgHdr = this.sysExStart.concat( this.mackieId, this.modelId)
  
    this.deviceDriver = context;
    
    this.initializationState = 'offLine'
    this.serialNumber  = [] // filled in when unit issues a Host Query or Responds to a Device Query
    this.version       = []
    this.challengeCode = [] // filled in when unit issues a Host Query
    this.responseCode  = []
  
  
    // Initialization
    this.ledStripText = [];
  
    this.midiInput = context.mPorts.makeMidiInput()
    this.midiOutput = context.mPorts.makeMidiOutput()
    
    // Commented out .expectInputNameEquals and .expectOutputNameEquals
    // Because other will havev a different midi interface.  User may have 
    // to modify for their interface name.
    this.deviceDriver.makeDetectionUnit().detectPortPair(this.midiInput, this.midiOutput)
       // .expectInputNameEquals('E-MU XMidi1X1')
       // .expectOutputNameEquals('E-MU XMidi1X1')
    
    // Setup callback to receive system exclusive messages
    // Since this is a callback, save the reference to 'this'.  
    var self = this 
    this.midiInput.mOnSysex = function(context, message) {
  
      // Function to convert an array of ASCII hex vakues to an ASCII string
      var arrayToAscii = function (arr) {
        var res = [];
        for (var i = 0; i < arr.length; i++) {
          res.push(String.fromCharCode(arr[i]));
        }
        return res.join("");
      };
    
      console.log("system exclusive message received");
      if (self.isHostConnectionQuery(message)) {
    
        self.midiOutput.sendMidi(context, self.hostConnectionReply(message));
        self.midiOutput.sendMidi(context, self.versionRequest());
      }
    
      if (self.isVersionReply(message)) {
        // Mackie C4 does not respond to the reply as indicated in the 
        // Logic Control Manual (the only documentation I have)
        // So respond here
        self.versionReply(message);
    
        console.log("Mackie C4 Detected");
        console.log("- Serial Number: ".concat(arrayToAscii(self.serialNumber)));
        console.log("- FW Version: ".concat(arrayToAscii(self.version)));
        console.log("- Script Version ".concat(sw_rev))
      }
  
      this.activeDevice = context;
    }
  
    // Setup callback on device activation
    // Device initialization
    this.deviceDriver.mOnActivate = function (context) {
      console.log("Device Driver Activated");
  
      self.midiOutput.sendMidi(context, self.deviceQuery());
  
      // Clear LEDs and initialize displays
      self.midiOutput.sendMidi(context , [0x90, 0x00,   0]);
      self.midiOutput.sendMidi(context , [0x90, 0x01,   0]);
      self.midiOutput.sendMidi(context , [0x90, 0x02,   0]);
      self.midiOutput.sendMidi(context , [0x90, 0x03,   0]);
      self.midiOutput.sendMidi(context , [0x90, 0x04,   0]);
      self.midiOutput.sendMidi(context , [0x90, 0x05,   0]);
      self.midiOutput.sendMidi(context , [0x90, 0x06,   0]);
      self.midiOutput.sendMidi(context , [0x90, 0x07,   0]);
      self.midiOutput.sendMidi(context , [0x90, 0x08,   0]);
    }
    
    // Setup the Mackie C4 Surface
    this.surface = this.deviceDriver.mSurface;
  
    //this.pagename = this.surface.makeLabelField(62,37.5,15,2.7)
  
  
    // Push Encoders
    var instance = 0;
    this.pushEncoder = new Array(4)
    for (var r = 0; r < 4; r++) {
      this.pushEncoder[r] = new Array(8);
      var y = 5 + r*12.5;
      for (var c = 0; c < 8; c++) {
        var x = 1.2 + c*7.5;
        this.pushEncoder[r][c] = new PushEncoder(this.surface, this.midiInput, this.midiOutput, x, y, 5, 5, instance);
        instance++;
      }
    }
  
  
    // Initialize Encoder Labels
    this.pushEncoderLabelTop = new Array(4)
    this.pushEncoderLabelBottom = new Array(4)
    for (var r = 0; r < 4; r++) {
      var y = r*12.5;
      this.pushEncoderLabelTop[r] = this.surface.makeLabelField(0, y, 64, 3.5);
    }
  
    // Used to mimic the LCD Displays
    //var label  = this.surface.makeLabelField(0, 0, 60, 4)
    //var label1 = this.surface.makeLabelField(0, 12.5, 60, 4)
    //var label2 = this.surface.makeLabelField(0, 25, 60, 4)
    //var label3 = this.surface.makeLabelField(0, 37.5, 60, 4)
    //var label4 = this.surface.makeLabelField(0, 47.5, 60, 4)
  
  
    ////////////////////////////////////
    // Function
    ////////////////////////////////////
  
    // Split
    var led_1_3 = this.surface.makeLamp(2.2, 51, 1.5, 1.5).setShapeCircle();
    var led_2_2 = this.surface.makeLamp(2.2, 53, 1.5, 1.5).setShapeCircle();
    var led_3_1 = this.surface.makeLamp(2.2, 55, 1.5, 1.5).setShapeCircle();
    this.split   =  new Button(this.surface, this.midiInput, this.midiOutput, 1.2, 56.5, 3.5, 3.5, 0x00);
  
    // Spot Erase
    this.ledSpotErase   = this.surface.makeLamp(7.2, 55, 1.5, 1.5).setShapeCircle();
    this.spotErase     = new Button(this.surface, this.midiInput, this.midiOutput, 6.2, 56.5, 3.5, 3.5, 0x04);
  
    // Lock
    var ledLock   = this.surface.makeLamp(7.2, 50, 1.5, 1.5).setShapeCircle();
    this.lock     = new Button(this.surface, this.midiInput, this.midiOutput, 6.2, 51.5, 3.5, 3.5, 0x03);
  
    ////////////////////////////////////
    // Assignment
    ////////////////////////////////////
   
    // Channel Strip
    var ledChanStrip = this.surface.makeLamp(12.2, 55, 1.5, 1.5).setShapeCircle();
    this.chanStrip     = new Button(this.surface, this.midiInput, this.midiOutput, 11.2, 56.5, 3.5, 3.5, 0x07);
  
    // Function
    var led_funcion  = this.surface.makeLamp(1.72, 5.5, 0.15, 0.15).setShapeCircle();
    this.function   = new Button(this.surface, this.midiInput, this.midiOutput, 16.2, 56.5, 3.5, 3.5, 0x08);
  
    // Marker
    var led_marker = this.surface.makeLamp(1.22, 5.0, 0.15, 0.15).setShapeCircle();
    this.marker     = new Button(this.surface, this.midiInput, this.midiOutput, 11.2, 51.5, 3.5, 3.5, 0x05);
  
    // Track
    var led_track  = this.surface.makeLamp(1.72, 5.0, 0.15, 0.15).setShapeCircle();
    this.track      = new Button(this.surface, this.midiInput, this.midiOutput, 16.2, 51.5, 3.5, 3.5, 0x06);
  
    ////////////////////////////////////
    // Modifiers
    ////////////////////////////////////
    this.ctrl       = new Button(this.surface, this.midiInput, this.midiOutput, 21.2, 56.5, 3.5, 3.5, 0x0F);
    this.alt        = new Button(this.surface, this.midiInput, this.midiOutput, 26.2, 56.5, 3.5, 3.5, 0x10);
    this.shift      = new Button(this.surface, this.midiInput, this.midiOutput, 21.2, 51.5, 3.5, 3.5, 0x0D);
    this.option     = new Button(this.surface, this.midiInput, this.midiOutput, 26.2, 51.5, 3.5, 3.5, 0x0E);
  
    ////////////////////////////////////
    // Parameter
    ////////////////////////////////////
  
    this.bankLeft      = new Button(this.surface, this.midiInput, this.midiOutput, 34, 51.5, 4, 4, 0x09);
    this.bankRight     = new Button(this.surface, this.midiInput, this.midiOutput, 41, 51.5, 4, 4, 0x0A);
    this.singleLeft    = new Button(this.surface, this.midiInput, this.midiOutput, 34, 56, 4, 4, 0x0B);
    this.singleRight   = new Button(this.surface, this.midiInput, this.midiOutput, 41, 56, 4, 4, 0x0C);
  
  
    this.prevTrack     = new Button(this.surface, this.midiInput, this.midiOutput, 48, 53.75, 4, 4, 0x13);
    this.nextTrack     = new Button(this.surface, this.midiInput, this.midiOutput, 55, 53.75, 4, 4, 0x14);
    this.slotUp        = new Button(this.surface, this.midiInput, this.midiOutput, 51.5, 51, 4, 4, 0x11);
    this.slotDown      = new Button(this.surface, this.midiInput, this.midiOutput, 51.5, 56.5, 4, 4, 0x12);
  
    //var page = deviceDriver.mMapping.makePage("default");
    //page.setLabelFieldText(label, "                                                                                                         ");
    // var label2 = surface.makeLabelField(0, 0.35, 6, 0.4)
    //page.setLabelFieldText(label2, "                                                                                                         ");
  }
  
  MackieC4.prototype.ident = function() {
    return("Class MackieC4");
  }
  
  MackieC4.prototype.isMackie = function(sysExMessage) {
    return (sysExMessage.slice(1,4).toString() == this.mackieId.toString())
  }
  
  MackieC4.prototype.isMackieC4 = function(sysExMessage) {
    return ((sysExMessage[4] == this.mcuC4ModelId[0]) && this.isMackie(sysExMessage))
  }
  
  MackieC4.prototype.isHostConnectionQuery = function(sysExMessage) {
    return ((sysExMessage[5] == this.hostConnectionQueryId[0]) && this.isMackieC4(sysExMessage));
  }
  
  MackieC4.prototype.isHostHostConnectionConfirmation = function(sysExMessage) {
    return ((sysExMessage[5] == this.hostConnectionConfirmationId[0]) && this.isMackieC4(sysExMessage));
  }
  
  MackieC4.prototype.isHostConnectionError = function(sysExMessage) {
    return ((sysExMessage[5] == this.hostConnectionErrorId[0]) && this.isMackieC4(sysExMessage));
  }
  
  MackieC4.prototype.hostConnectionReply = function (hostConnectionQuery) {
    
    var responseCode = []
  
    this.serialNumber = hostConnectionQuery.slice(6,13);
    this.challengeCode = hostConnectionQuery.slice(13,17);
  
    // Calculate the response code
    var l = this.challengeCode;
    var r = []
  
    r[0] = 0x7F & (l[0]+(l[1]^0xA)-l[3]);
    r[1] = 0x7F & ((l[2]>>4)^(l[0]+l[3]));
    r[2] = 0x7F & (l[3]-(l[2]<<2)^(l[0]|l[1]));
    r[3] = 0x7F & (l[1]-l[2]+(0xF0^(l[3]<<4)));
  
    this.responseCode = r;
  
    return(this.sysExMsgHdr.concat(this.hostConnectionReplyId, this.serialNumber, this.responseCode, [0xF7]));
  }
  
  MackieC4.prototype.deviceQuery = function () {
    return(this.sysExMsgHdr.concat(this.deviceQueryId, this.responseCode, [0xF7]));
  }
  
  MackieC4.prototype.versionRequest = function () {
    return(this.sysExMsgHdr.concat(this.firmwareVersionRequestId, [0xF7]));
  }
  
  MackieC4.prototype.isVersionReply = function(sysExMessage) {
    return ((sysExMessage[5] == this.firmwareVersionReplyId[0]) && this.isMackieC4(sysExMessage));
  }
  
  MackieC4.prototype.versionReply = function (message) {
    this.version = message.slice(6,11);
  }
  
  MackieC4.prototype.setLedStripText = function(strip, lower, text) {
    this.ledStripText[2*strip+lower] = text;
  }
  
  MackieC4.prototype.setLedStrip = function(context, strip, lower) {
    function stringToAsciiArray(text) {
      var charCodeArray = []
      for (var i=0; i<text.length; i++) {
        var code = text.charCodeAt(i);
        charCodeArray.push(code);
      } 
      return(charCodeArray);
    }
    var textArray = stringToAsciiArray(this.ledStripText[2*strip+lower].substring(0, 55));
    this.midiOutput.sendMidi(context, this.sysExMsgHdr.concat(0x30+strip, 0x38*lower, textArray, 0xF7));
  }
  
  MackieC4.prototype.clearLedDisolays = function(context) {
    var spaces = [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20]
    this.midiOutput.sendMidi(context, this.sysExMsgHdr.concat(0x30, 0x00, spaces, 0xF7));
    this.midiOutput.sendMidi(context, this.sysExMsgHdr.concat(0x30, 0x38, spaces, 0xF7));
    this.midiOutput.sendMidi(context, this.sysExMsgHdr.concat(0x31, 0x00, spaces, 0xF7));
    this.midiOutput.sendMidi(context, this.sysExMsgHdr.concat(0x31, 0x38, spaces, 0xF7));
    this.midiOutput.sendMidi(context, this.sysExMsgHdr.concat(0x32, 0x00, spaces, 0xF7));
    this.midiOutput.sendMidi(context, this.sysExMsgHdr.concat(0x32, 0x38, spaces, 0xF7));
    this.midiOutput.sendMidi(context, this.sysExMsgHdr.concat(0x33, 0x00, spaces, 0xF7));
    this.midiOutput.sendMidi(context, this.sysExMsgHdr.concat(0x33, 0x38, spaces, 0xF7));
  }
  
  MackieC4.prototype.clearVPotLeds = function(context) {
    for (var r=0; r < 4; r++) {
      for (var c=0; c < 8; c++) {
        this.pushEncoder[r][c].clearVPotLed(context);
      }
    }
  }
  

  module.exports = {
    MackieC4
  }