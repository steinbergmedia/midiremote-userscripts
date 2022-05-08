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

PushEncoder.prototype.setVPotLed = function(value) {
  this.vPotValue = value;
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

PushEncoder.prototype.sendVPotLedMidi = function(context) {
  var val = Math.round(1 + this.vPotValue*9.99) + 16*this.vPotLedMode + 64*this.vPotLedOn;
  this.midiOutput.sendMidi(context , [0xb0, this.instance + 32, val]);
}

PushEncoder.prototype.clearVPotLed = function(context) {
  this.midiOutput.sendMidi(context ,  [0xb0, this.instance + 32, 0]);
  //this.vPotValue = 0;
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




  
module.exports = {
  PushEncoder,
  Button
}