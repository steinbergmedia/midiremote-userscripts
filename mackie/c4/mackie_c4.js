var sw_rev = '1.02'

//-----------------------------------------------------------------------------
// 0. INCLUDE common functions
//-----------------------------------------------------------------------------

/**
 * PushEncoder class
 *
 * @constructor
 * @param {MR_DeviceSurface} surface
 * @param {MR_DeviceMidiInput} midiInput
 * @param {MR_DeviceMidiOutput} midiOutput
 * @param {number} x           - x location of the push encoder in the gui
 * @param {Number} y           - y location of the push encoder in the gui
 * @param {Number} w           - width of the push encoder.
 * @param {Number} h           - height of the push encoder.
 * @param {Number} instance    - instance of the push encoder.
 */
function PushEncoder(surface, midiInput, midiOutput, x, y, w, h, instance) {

  // Position on GUI
  this.surface = surface;
  this.midiInput  = midiInput;
  this.midiOutput = midiOutput;
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.instance = instance;
  this.row = Math.floor(this.instance/8);
  this.column = this.instance % 8;

  this.ident = function() {
    return("Class pushEncoder");
  }

  // Mackie Pushencoder State
  this.switchId = 32 + this.instance;
  this.switchState = 0;      // on, off
  this.ledId = 0;
  this.ledMode = 0;          // on, off, flashing
  this.vPotId = this.instance;
  this.vPotValue = 0;
  this.vPotLedRingId = 0;
  this.vPotLedMode = 0;      // singleDot, boostCut, wrap, spread
  this.vPotLedOn = 0;
  this.lcdId = 0;

  this.labelText = ['------|', '------|'];

  this.pushEncoder = this.surface.makePushEncoder(x, y, w, h)
  
  // Bind push switches & encoders to note/control codes
  this.pushEncoder.mEncoderValue.mMidiBinding
      .setInputPort(midiInput)
      .bindToControlChange (0, this.vPotId)
      .setTypeRelativeSignedBit();

  this.pushEncoder.mPushValue.mMidiBinding
      .setInputPort(midiInput)
      .bindToNote (0, this.switchId);
}

PushEncoder.prototype.sendVPotLedMidi = function(context) {
  var val = Math.round(1 + this.vPotValue*9.99) + 16*this.vPotLedMode + 64*this.vPotLedOn;
  this.midiOutput.sendMidi(context , [0xb0, this.instance + 32, val]);
}

PushEncoder.prototype.setVPotLed = function(value) {
  this.vPotValue = value;
}

PushEncoder.prototype.clearVPotLed = function(context) {
  this.midiOutput.sendMidi(context ,  [0xb0, this.instance + 32, 0]);
  //this.vPotValue = 0;
}

PushEncoder.prototype.setVPotLedMode = function(mode) {
  this.vPotLedMode = mode;
  //var value = this.vPotValue + 16*this.vPotLedMode + 64*this.vPotLedOn
  //this.midiOutput.sendMidi(context ,  [0xb0, this.instance + 32, 0]);
  this.vPotLedMode = mode;
}

PushEncoder.prototype.setVPotCenterLed = function(on) {
  this.vPotLedOn = on
}


PushEncoder.prototype.setLabelText = function(context, lower, labelText) {
  // Need tom ove sysex to it's own class
  var hdr = [0xF0, 0x00, 0x00, 0x66, 0x17];
  var strip = (0x30 + Math.floor(this.instance/8));
  var offset =  ((this.instance % 8) * 7) + 56*lower;
  var label = []
  for (var i = 0; i < 7; i++) {
    label = label.concat(labelText.charCodeAt(i));
  }
  var sysex =  hdr.concat(strip, offset, label, 0xF7);
  this.midiOutput.sendMidi(context, sysex);
}


/**
 * Button class
 *
 * @constructor
 * @param {MR_DeviceSurface} surface
 * @param {MR_DeviceMidiInput} midiInput
 * @param {MR_DeviceMidiOutput} midiOutput
 * @param {number} x           - x location of the push encoder in the gui
 * @param {Number} y           - y location of the push encoder in the gui
 * @param {Number} w           - width of the push encoder.
 * @param {Number} h           - height of the push encoder.
 * @param {Number} id    - instance of the push encoder.
 */
function Button(surface, midiInput, midiOutput, x, y, w, h, id) {
  
  this.surface = surface;
  this.midiInput  = midiInput;
  this.midiOutput = midiOutput;
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.id = id;

  this.buttonState = 0;

  this.ident = function() {
    return("Class Button");
  }

  // Bind button to note
  this.button = this.surface.makeButton(x, y, w, h).setShapeCircle()

  this.button.mSurfaceValue.mMidiBinding
      .setInputPort(this.midiInput)
      .bindToNote (0, this.id);
}

// Used to track the button state for buttons without an associated LED
Button.prototype.toggleButtonState = function(context) {
  this.buttonState = 1 - this.buttonState;
}

// Used to track the button state and toggle the associated LED accordingly
Button.prototype.toggleButtonStateLed = function(context) {
  this.buttonState = 1 - this.buttonState;
  var value = this.buttonState  *0x7F;
  this.midiOutput.sendMidi(context , [0x90, this.id, value]);
}

// Used for teh split button.  Cycles through 4 states and lights the LEDs accordingly
Button.prototype.cycleButtonStateLed = function(context) {
  this.buttonState = (this.buttonState + 1) % 4;
  switch (this.buttonState) {
    case 0: 
      this.midiOutput.sendMidi(context , [0x90, this.id,   0]);
      this.midiOutput.sendMidi(context , [0x90, this.id+1, 0]);
      this.midiOutput.sendMidi(context , [0x90, this.id+2, 0]);
    break;
    case 1: 
      this.midiOutput.sendMidi(context , [0x90, this.id,   0x7F]);
      this.midiOutput.sendMidi(context , [0x90, this.id+1, 0]);
      this.midiOutput.sendMidi(context , [0x90, this.id+2, 0]);
      break;
    case 2: 
      this.midiOutput.sendMidi(context , [0x90, this.id,   0]);
      this.midiOutput.sendMidi(context , [0x90, this.id+1, 0x7F]);
      this.midiOutput.sendMidi(context , [0x90, this.id+2, 0]);
      break;
    case 3: 
      this.midiOutput.sendMidi(context , [0x90, this.id,   0]);
      this.midiOutput.sendMidi(context , [0x90, this.id+1, 0]);
      this.midiOutput.sendMidi(context , [0x90, this.id+2, 0x7F]);
      break;
  }
}

Button.prototype.setLedOn = function(context) {
  this.midiOutput.sendMidi(context , [0x90, this.id, 0x7F]);
}

Button.prototype.setLedOff = function(context) {
  this.midiOutput.sendMidi(context , [0x90, this.id, 0x00]);
}

Button.prototype.setLedFlashing = function(context) {
  this.midiOutput.sendMidi(context , [0x90, this.id, 0x01]);
}

/**
 * MackieC4 class
 *
 * @constructor
 * @param {object} context
 */
function MackieC4(context) {

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

  this.deviceDriver = deviceDriver;
  
  this.initializationState = 'offLine'
  this.serialNumber  = [] // filled in when unit issues a Host Query or Responds to a Device Query
  this.version       = []
  this.challengeCode = [] // filled in when unit issues a Host Query
  this.responseCode  = []


  // Initialization
  this.ledStripText = [];

  this.midiInput = deviceDriver.mPorts.makeMidiInput()
  this.midiOutput = deviceDriver.mPorts.makeMidiOutput()
  
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

// 
// MackieC4.prototype.clearCtrlLeds = function(context) {
// 
// }
// 
// MackieC4.prototype.clearAll = function(context) {
//   this.clearLedDisolays(context);
//   this.clearVPotLeds(context);
// }

MackieC4.prototype.writeEncoderLabel = function(row, col, bottom, text) {
  
}


//-----------------------------------------------------------------------------
// 1. DRIVER SETUP - create driver object, midi ports and detection information
//-----------------------------------------------------------------------------

var midiremote_api = require('midiremote_api_v1')
var deviceDriver = midiremote_api.makeDeviceDriver('mackie', 'c4', 'Ron Garrison')

//----------------------------------------------------------------------------------------------------------------------
// 2. SURFACE LAYOUT - create control elements and midi bindings
//----------------------------------------------------------------------------------------------------------------------

var mackieC4 = new MackieC4(deviceDriver);

//----------------------------------------------------------------------------------------------------------------------
// 3. HOST MAPPING - create mapping pages and host bindings
//----------------------------------------------------------------------------------------------------------------------

//-------------------
// Equalizer Mix Page
//-------------------

// var eqMixPage = new EqMixPage(mackieC4, 'EQ Mixer Mode');

function makeEqMixPage() {
  function printTrackTitles(button, ch) {

    var trackTitle = mackieC4.surface.makeCustomValueVariable('trackTitle');

    trackTitle.mOnTitleChange = function(context, objectTitle, valueTitle) {
      var text = "      |";
      if (objectTitle.length < 7) {
        text = text.replace(text.substring(0, objectTitle.length), objectTitle.substring(0, objectTitle.length));
      } else {
        text = text.replace(text.substring(0, 4), objectTitle.substring(0, 4));
        text = text.replace(text.substring(4, 6), objectTitle.substring(objectTitle.length-2, objectTitle.length));
      }
      button.setLabelText(context, 0, text);
      // console.log("Print Track Title".concat(button.row.toString(), button.column.toString(),  text));
    }

    page.makeValueBinding(trackTitle, ch);
  }


  console.log("Page EqMix Initialization");


  this.eqBand = 1;
  this.writeAutomationState = 0;
  this.selectedTrackName = '';
  this.transportRecordState = 0;

  var page = deviceDriver.mMapping.makePage('EQ Mixer Mode')
  //page.setLabelFieldText(mackieC4.pagename, 'EQ Mixer Mode')
  
  
  var hostMixerBankZone = page.mHostAccess.mMixConsole.makeMixerBankZone()
  .excludeInputChannels()
  .excludeOutputChannels()
  
  var EqSubPageArea = page.makeSubPageArea('EQ area');
  var subPageEQ1 = EqSubPageArea.makeSubPage('EQ 1');
  var subPageEQ2 = EqSubPageArea.makeSubPage('EQ 2');
  var subPageEQ3 = EqSubPageArea.makeSubPage('EQ 3');
  var subPageEQ4 = EqSubPageArea.makeSubPage('EQ 4');
  
  var channelBankItem = new Array(8);
  for (var i = 0; i < 8; ++i) {
    // Host Mapping
    channelBankItem[i] = hostMixerBankZone.makeMixerBankChannel()
    var knobRow0 = mackieC4.pushEncoder[0];
    var knobRow1 = mackieC4.pushEncoder[1];
    var knobRow2 = mackieC4.pushEncoder[2];
    var knobRow3 = mackieC4.pushEncoder[3];
    // EQ 1
    page.makeValueBinding(knobRow3[i].pushEncoder.mPushValue,    channelBankItem[i].mChannelEQ.mBand1.mOn).setSubPage(subPageEQ1).setTypeToggle();
    page.makeValueBinding(knobRow0[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand1.mFreq).setSubPage(subPageEQ1);
    page.makeValueBinding(knobRow1[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand1.mGain).setSubPage(subPageEQ1);
    page.makeValueBinding(knobRow2[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand1.mQ).setSubPage(subPageEQ1);
    page.makeValueBinding(knobRow3[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand1.mFilterType).setSubPage(subPageEQ1);
    // EQ 2[i]
    page.makeValueBinding(knobRow3[i].pushEncoder.mPushValue,    channelBankItem[i].mChannelEQ.mBand2.mOn).setSubPage(subPageEQ2).setTypeToggle();
    page.makeValueBinding(knobRow0[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand2.mFreq).setSubPage(subPageEQ2);
    page.makeValueBinding(knobRow1[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand2.mGain).setSubPage(subPageEQ2);
    page.makeValueBinding(knobRow2[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand2.mQ).setSubPage(subPageEQ2);
    page.makeValueBinding(knobRow3[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand2.mFilterType).setSubPage(subPageEQ2);
    // EQ 3
    page.makeValueBinding(knobRow3[i].pushEncoder.mPushValue,    channelBankItem[i].mChannelEQ.mBand3.mOn).setSubPage(subPageEQ3).setTypeToggle();
    page.makeValueBinding(knobRow0[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand3.mFreq).setSubPage(subPageEQ3);
    page.makeValueBinding(knobRow1[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand3.mGain).setSubPage(subPageEQ3);
    page.makeValueBinding(knobRow2[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand3.mQ).setSubPage(subPageEQ3);
    page.makeValueBinding(knobRow3[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand3.mFilterType).setSubPage(subPageEQ3);
    // EQ 4
    page.makeValueBinding(knobRow3[i].pushEncoder.mPushValue,    channelBankItem[i].mChannelEQ.mBand4.mOn).setSubPage(subPageEQ4).setTypeToggle();
    page.makeValueBinding(knobRow0[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand4.mFreq).setSubPage(subPageEQ4);
    page.makeValueBinding(knobRow1[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand4.mGain).setSubPage(subPageEQ4);
    page.makeValueBinding(knobRow2[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand4.mQ).setSubPage(subPageEQ4);
    page.makeValueBinding(knobRow3[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand4.mFilterType).setSubPage(subPageEQ4);
  

    printTrackTitles(knobRow0[i], channelBankItem[i].mValue.mVolume);

  }
  
  function sendFeedbackOut(context, button, ch) {
    
    button.pushEncoder.mEncoderValue.mOnProcessValueChange = function (context, newValue) {
      var r = button.row.toString();
      var c = button.column.toString();
      var normalized = Math.round(newValue*126.99).toString()
      // console.log("Encoder ProcessValueChange(".concat(r, ",", c, ") = ", newValue.toString(), ",  ",  normalized))
      var text = ''
      switch (button.row) {
        case 0:
          break;
        case 1:
          // Use VPotLedMode 1 for Gain
          button.setVPotLedMode(1)
          // Calculate Gain
          text = ((Math.round(newValue*480)/10)-24).toFixed(1);
          //  console.log(text)
          break;
        case 2:
          // Calculate Q Factor
          text = (Math.round(newValue*120)/10).toFixed(1);
          break;
        case 3:
          // Determine Filter Type
          switch (this.eqPage) {
            case 1:
              if      (newValue < 0.1428571492433548) {text = 'P I   |'} 
              else if (newValue < 0.2857142984867096) {text = 'LS I  |'} 
              else if (newValue < 0.4285714328289032) {text = 'HP I  |'} 
              else if (newValue < 0.5714285969734192) {text = 'HP II |'} 
              else if (newValue < 0.7142857313156128) {text = 'P II  |'} 
              else if (newValue < 0.8571428656578064) {text = 'LS II |'} 
              else if (newValue < 1)                  {text = 'LS III|'} 
              else                                    {text = 'LS IV |'} 
              break;
            case 2:
            case 3:
              if      (newValue == 0) {text = 'P I   |'} 
              else                    {text = 'P II  |'}
              break;
            case 4:
              if      (newValue < 0.1428571492433548) {text = 'P I   |'} 
              else if (newValue < 0.2857142984867096) {text = 'HS I  |'} 
              else if (newValue < 0.4285714328289032) {text = 'LP I  |'} 
              else if (newValue < 0.5714285969734192) {text = 'LP II |'} 
              else if (newValue < 0.7142857313156128) {text = 'P II  |'} 
              else if (newValue < 0.8571428656578064) {text = 'HS II |'} 
              else if (newValue < 1)                  {text = 'HS III|'} 
              else                                    {text = 'HS IV |'} 
              break;
          }
          break;
      }
      button.setVPotLed(newValue)
      button.sendVPotLedMidi(context);
     }  

     // button.pushEncoder.mPushValue.mOnProcessValueChange = function (context, value) {
     //  var r = button.row.toString();
     //  var c = button.column.toString();
     //  // console.log("Push ProcessValueChange(".concat(r, ",", c, ") = ", value.toString()))
     //   switch (button.row) {
     //     case 0: break;
     //     case 1: break;
     //     case 2: break;
     //     case 3: button.setVPotCenterLed(value); break;
     //   }
     //   button.setVPotLed(value)
     //   button.sendVPotLedMidi(context);
     // }
  
     button.pushEncoder.mPushValue.mOnProcessValueChange = function (context, value) {
       switch (button.row) {
         case 0: break;
         case 1: break;
         case 2: break;
         case 3: button.setVPotCenterLed(value); break;
       }
       button.sendVPotLedMidi(context);
     }
  // 
    button.pushEncoder.mEncoderValue.mOnDisplayValueChange = function (context, displayText, str2) {
      var r = button.row.toString();
      var c = button.column.toString();
      // console.log("DisplayValueChange(".concat(r, ",", c, ") - ", displayText))
  
      var text = "      |"
      switch (button.row) {
        case 0:
          // Frequency
          // Strip Hz off the end
          text = text.replace(text.substring(0, displayText.length-2), displayText.substring(0, displayText.length-2));
          break;
        case 1:
          
          text = text.replace(text.substring(0, displayText.length-2), displayText.substring(0, displayText.length-2));
          break;
        case 2:
          text = text.replace(text.substring(0, displayText.length), displayText.substring(0, displayText.length));
          break;
        case 3:
          switch (displayText) {
            case 'Parametric I':   text = "P I   |"; break;
            case 'Parametric II':  text = "P II  |"; break;
            case 'Low Shelf I':    text = "LS I  |"; break;
            case 'Low Shelf II':   text = "LS II |"; break;
            case 'Low Shelf III':  text = "LS III|"; break;
            case 'Low Shelf IV':   text = "LS IV |"; break;
            case 'High Pass I':    text = "HP I  |"; break;
            case 'High Pass II':   text = "HP II |"; break;
            case 'High Shelf I':   text = "HS I  |"; break;
            case 'High Shelf II':  text = "HS II |"; break;
            case 'High Shelf III': text = "HS III|"; break;
            case 'High Shelf IV':  text = "HS IV |"; break;
            case 'Low Pass I':     text = "LP I  |"; break;
            case 'Low Pass II':    text = "LP II |"; break;
          }
          break;
      }
      button.setLabelText(context, 1, text);
    }
  }
  
   
  // Equallzer Select
  var eqPrevButton = mackieC4.slotDown;
  var eqNextButton = mackieC4.slotUp;
  page.makeActionBinding(eqPrevButton.button.mSurfaceValue, EqSubPageArea.mAction.mPrev);
  page.makeActionBinding(eqNextButton.button.mSurfaceValue, EqSubPageArea.mAction.mNext);
  
  page.setLabelFieldText(mackieC4.pushEncoderLabelTop[0], "Equalizer Mixer Page");

  
  

  subPageEQ1.mOnActivate = function(activeDevice) {
    this.eqBand = 1;
    mackieC4.pushEncoder[1][0].setLabelText(activeDevice, 0, "EQ1----");
    mackieC4.pushEncoder[2][0].setLabelText(activeDevice, 0, "EQ1----");
    mackieC4.pushEncoder[3][0].setLabelText(activeDevice, 0, "EQ1----");
  
    // the EQ Type sub page has been activated, turn EQ Type LED on
    console.log('EQ1 Subpage Activated');
    for (var i = 0; i < 8; i++) {
      //page.makeValueBinding(mackieC4.pushEncoder[0][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand1.mFreq).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
      //page.makeValueBinding(mackieC4.pushEncoder[1][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand1.mGain).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
      //page.makeValueBinding(mackieC4.pushEncoder[2][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand1.mQ).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
      //page.makeValueBinding(mackieC4.pushEncoder[3][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand1.mFilterType).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
  //
      // Frequency
      sendFeedbackOut(activeDevice, mackieC4.pushEncoder[0][i], channelBankItem[i].mValue.mVolume);
      // Gain
      sendFeedbackOut(activeDevice, mackieC4.pushEncoder[1][i], channelBankItem[i].mValue.mVolume);
      // Q-factor
      sendFeedbackOut(activeDevice, mackieC4.pushEncoder[2][i], channelBankItem[i].mValue.mVolume);
      // Filter Type
      sendFeedbackOut(activeDevice, mackieC4.pushEncoder[3][i], channelBankItem[i].mValue.mVolume);
    }  
  }
   
  subPageEQ2.mOnActivate = function(activeDevice) {
    this.eqBand = 2;
    mackieC4.pushEncoder[1][0].setLabelText(activeDevice, 0, "EQ2----");
    mackieC4.pushEncoder[2][0].setLabelText(activeDevice, 0, "EQ2----");
    mackieC4.pushEncoder[3][0].setLabelText(activeDevice, 0, "EQ2----");
    // the EQ Type sub page has been activated, turn EQ Type LED on
    console.log('EQ2 Subpage Activated');
    for (var i = 0; i < 8; i++) {
      //page.makeValueBinding(mackieC4.pushEncoder[0][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand2.mFreq).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
      //page.makeValueBinding(mackieC4.pushEncoder[1][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand2.mGain).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
      //page.makeValueBinding(mackieC4.pushEncoder[2][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand2.mQ).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
      //page.makeValueBinding(mackieC4.pushEncoder[3][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand2.mFilterType).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
  
      // Frequency
      sendFeedbackOut(activeDevice, mackieC4.pushEncoder[0][i], channelBankItem[i].mValue.mVolume);
      // Gain
      sendFeedbackOut(activeDevice, mackieC4.pushEncoder[1][i], channelBankItem[i].mValue.mVolume);
      // Q-factor
      sendFeedbackOut(activeDevice, mackieC4.pushEncoder[2][i], channelBankItem[i].mValue.mVolume);
      // Filter Type
      sendFeedbackOut(activeDevice, mackieC4.pushEncoder[3][i], channelBankItem[i].mValue.mVolume);
    }  
  }
   
  subPageEQ3.mOnActivate = function(activeDevice) {
    this.eqBand = 3;
    mackieC4.pushEncoder[1][0].setLabelText(activeDevice, 0, "EQ3----");
    mackieC4.pushEncoder[2][0].setLabelText(activeDevice, 0, "EQ3----");
    mackieC4.pushEncoder[3][0].setLabelText(activeDevice, 0, "EQ3----");
    // the EQ Type sub page has been activated, turn EQ Type LED on
    console.log('EQ3 Subpage Activated');
    for (var i = 0; i < 8; i++) {
      //page.makeValueBinding(mackieC4.pushEncoder[0][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand3.mFreq).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
      //page.makeValueBinding(mackieC4.pushEncoder[1][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand3.mGain).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
      //page.makeValueBinding(mackieC4.pushEncoder[2][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand3.mQ).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
      //page.makeValueBinding(mackieC4.pushEncoder[3][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand3.mFilterType).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
  
      // Frequency
      sendFeedbackOut(activeDevice, mackieC4.pushEncoder[0][i], channelBankItem[i].mValue.mVolume);
      // Gain
      sendFeedbackOut(activeDevice, mackieC4.pushEncoder[1][i], channelBankItem[i].mValue.mVolume);
      // Q-factor
      sendFeedbackOut(activeDevice, mackieC4.pushEncoder[2][i], channelBankItem[i].mValue.mVolume);
      // Filter Type
      sendFeedbackOut(activeDevice, mackieC4.pushEncoder[3][i], channelBankItem[i].mValue.mVolume);
    }  
  }
   
  subPageEQ4.mOnActivate = function(activeDevice) {
    this.eqBand = 4;
    mackieC4.pushEncoder[1][0].setLabelText(activeDevice, 0, "EQ4----");
    mackieC4.pushEncoder[2][0].setLabelText(activeDevice, 0, "EQ4----");
    mackieC4.pushEncoder[3][0].setLabelText(activeDevice, 0, "EQ4----");
    // the EQ Type sub page has been activated, turn EQ Type LED on
    console.log('EQ4 Subpage Activated');
    for (var i = 0; i < 8; i++) {
      //page.makeValueBinding(mackieC4.pushEncoder[0][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand4.mFreq).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
      //page.makeValueBinding(mackieC4.pushEncoder[1][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand4.mGain).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
      //page.makeValueBinding(mackieC4.pushEncoder[2][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand4.mQ).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
      //page.makeValueBinding(mackieC4.pushEncoder[3][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand4.mFilterType).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
   
      // Frequency
      sendFeedbackOut(activeDevice, mackieC4.pushEncoder[0][i], channelBankItem[i].mValue.mVolume);
      // Gain
      sendFeedbackOut(activeDevice, mackieC4.pushEncoder[1][i], channelBankItem[i].mValue.mVolume);
      // Q-factor
      sendFeedbackOut(activeDevice, mackieC4.pushEncoder[2][i], channelBankItem[i].mValue.mVolume);
      // Filter Type
      sendFeedbackOut(activeDevice, mackieC4.pushEncoder[3][i], channelBankItem[i].mValue.mVolume);
    }  
  }
   
  
   
  // Shift by bank
  var prevBank = mackieC4.bankLeft;
  var nextBank = mackieC4.bankRight;
  
  // Instead of this:
  // page.makeActionBinding(prevBank.button.mSurfaceValue,  hostMixerBankZone.mAction.mPrevBank);
  // page.makeActionBinding(nextBank.button.mSurfaceValue,  hostMixerBankZone.mAction.mNextBank);
  
  // Do this:
  // Create Custom Value Variable
  var prevBankSelect = mackieC4.surface.makeCustomValueVariable('prevBankSelect');
  var nextBankSelect = mackieC4.surface.makeCustomValueVariable('nextBankSelect');
  
  prevBank.button.mSurfaceValue.mOnProcessValueChange = function (activeDevice, value) {
    
    if (value == 1) {
      // Clear LEDs prior to shifting
      mackieC4.clearVPotLeds(activeDevice);
  
      // Only send on press, not release
      prevBankSelect.setProcessValue(activeDevice, 1);
    }
  }
  
  nextBank.button.mSurfaceValue.mOnProcessValueChange = function (activeDevice, value) {
    if (value == 1) {
      mackieC4.clearVPotLeds(activeDevice);
   
      // Only send on press, not release
      nextBankSelect.setProcessValue(activeDevice, 1);
    }
  }
  
  // Now bind to the custom Value Variable instead of the button
  page.makeActionBinding(prevBankSelect, hostMixerBankZone.mAction.mPrevBank)
  page.makeActionBinding(nextBankSelect, hostMixerBankZone.mAction.mNextBank)
  
  
  
  
  // Shift by track
  var shiftLeft = mackieC4.singleLeft;
  var shiftRight = mackieC4.singleRight;
  //  page.makeActionBinding(shiftLeft.button.mSurfaceValue,  hostMixerBankZone.mAction.mShiftLeft);
  //  page.makeActionBinding(shiftRight.button.mSurfaceValue,  hostMixerBankZone.mAction.mShiftRight);
  
  var prevChannel = mackieC4.surface.makeCustomValueVariable('prevChannel');
  var nextChannel = mackieC4.surface.makeCustomValueVariable('nextChannel');
  
  shiftLeft.button.mSurfaceValue.mOnProcessValueChange = function (activeDevice, value) {
    if (value == 1) {
      // Clear LEDs prior to shifting
      mackieC4.clearVPotLeds(activeDevice);
  
      // Only send on press, not release
      prevChannel.setProcessValue(activeDevice, 1);
    }
  }
  
  shiftRight.button.mSurfaceValue.mOnProcessValueChange = function (activeDevice, value) {
    if (value == 1) {
      // Clear LEDs prior to shifting
      mackieC4.clearVPotLeds(activeDevice);
  
      // Only send on press, not release
      nextChannel.setProcessValue(activeDevice, 1);
    }
  }
  
  // Now bind to the custom Value Variable instead of the button
  page.makeActionBinding(prevChannel, hostMixerBankZone.mAction.mShiftLeft)
  page.makeActionBinding(nextChannel, hostMixerBankZone.mAction.mShiftRight)




  // Write Automation Test for UMan
  // this.chanStrip
  // this.func

  // Write Automation Test for UMan
	// var selectedTrackChannel = page.mHostAccess.mTrackSelection.mMixerChannel
  // 
  // var self = this;
  // selectedTrackChannel.mValue.mAutomationWrite.mOnTitleChange = function (context, mapping, text1, text2) {
  //   self.selectedTrackName = text1
  //   console.log(text1)
  //   console.log(text2)
  // }
  // 
  // // Set the state of the selected track's Write Automation State
  // var self = this;
  // selectedTrackChannel.mValue.mAutomationWrite.mOnDisplayValueChange = function (context, mapping, text1, text2) {
  //   switch (text1) {
  //     case 'Off': self.writeAutomationState = 0; break;
  //     case 'On':  self.writeAutomationState = 1; break;
  //   }
  //  console.log(text1)
  //  console.log(text2)
  //  if (self.writeAutomationState == 0) {
  //   writeAutomation.setLedOff(context)
  //  } else if (self.transportRecordState == 0) {
  //    writeAutomation.setLedOn(context)
  //  } else {
  //    writeAutomation.setLedFlashing(context)
  //  }
  // 
  // }
  // 
  // var self = this;
  // var writeAutomation = mackieC4.spotErase;
  // var writeAutomationCvv = mackieC4.surface.makeCustomValueVariable('writeAutomationCvv');
	// page.makeValueBinding(writeAutomationCvv, selectedTrackChannel.mValue.mAutomationWrite).setTypeToggle() // Spot Erase button || .setValueTakeOverModeScaled()
  // writeAutomation.button.mSurfaceValue.mOnProcessValueChange = function (context, newValue) {
  //   console.log('writeAutomationProcess_value')
  //   if (newValue == 1) {
  //     self.writeAutomationState = 1 - self.writeAutomationState;
  //     writeAutomationCvv.setProcessValue(context, self.writeAutomationState);
  //     console.log(self.writeAutomationState.toString())
  //   }
  // 
  //   if (self.writeAutomationState == 0) {
  //     writeAutomation.setLedOff(context)
  //   } else if (self.transportRecordState == 0) {
  //     writeAutomation.setLedOn(context)
  //   } else {
  //     writeAutomation.setLedFlashing(context)
  //   }
	// }
  // 
  // var self = this;
  // var transportRecord = mackieC4.chanStrip;
	// page.makeValueBinding(transportRecord.button.mSurfaceValue, page.mHostAccess.mTransport.mValue.mRecord).setTypeToggle() // Spot Erase button || .setValueTakeOverModeScaled()
  // transportRecord.button.mSurfaceValue.mOnProcessValueChange = function (context, newValue) {
  //   console.log('transportRecordProcess_value')
  //   self.transportRecordState = newValue;
  //   console.log(self.transportRecordState.toString())
  //   if (self.writeAutomationState == 0) {
  //     writeAutomation.setLedOff(context)
  //   } else if (self.transportRecordState == 0) {
  //     writeAutomation.setLedOn(context)
  //   } else {
  //     writeAutomation.setLedFlashing(context)
  //   }
	// }
  // 
  // var transportStop = mackieC4.function;
	// page.makeValueBinding(transportStop.button.mSurfaceValue, page.mHostAccess.mTransport.mValue.mStop).setTypeToggle() // Spot Erase button || .setValueTakeOverModeScaled()
  // transportStop.button.mSurfaceValue.mOnProcessValueChange = function (context, newValue) {
	// }

  return page;
}



var eqMixPage = makeEqMixPage();


eqMixPage.mOnActivate = function(context) {
  //mackieC4.clearAll(context)
  mackieC4.setLedStripText(1, 0, 'EQ1--------------------Gain (dB)------------------------');
  mackieC4.setLedStripText(2, 0, 'EQ1--------------------Q Factor-------------------------');
  mackieC4.setLedStripText(3, 0, 'EQ1------------Filter Type-(Push=on/off)----------------');
  mackieC4.setLedStrip(context, 1, 0);
  mackieC4.setLedStrip(context, 2, 0);
  mackieC4.setLedStrip(context, 3, 0);    
}
 