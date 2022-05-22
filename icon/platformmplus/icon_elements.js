/**
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
function channelControl(surface, midiInput, midiOutput, x, y, instance) {
  // Position on GUI
  this.surface = surface;
  this.midiInput = midiInput;
  this.midiOutput = midiOutput;
  this.x = x + 2 * instance;
  this.y = y;
  this.instance = instance; // Channel number, 1-8

  this.ident = function () {
    return ("Class channelControl");
  }

  this.vPotValue = 0;
  this.vPotPushValue = 0;
  this.vFaderValue = 0;
  this.vFaderTouched = 0;
  this.vSelLedOn = 0;
  this.vMuteLedOn = 0;
  this.vSoloLedOn = 0;
  this.vRecLedOn = 0;

  // Pot encoder
  this.pushEncoder = this.surface.makePushEncoder(this.x, y, 2, 2)

  this.pushEncoder.mEncoderValue.mMidiBinding
    .setInputPort(midiInput)
    .bindToControlChange(0, 16 + this.instance)
    .setTypeRelativeSignedBit();

  this.pushEncoder.mPushValue.mMidiBinding
    .setInputPort(midiInput)
    .bindToNote(0, 32 + this.instance);

  // Fader + Fader Touch
  var fader_x = this.x
  var fader_y = y + 3
  this.fader = surface.makeFader(fader_x, fader_y, 1, 8).setTypeVertical()
  this.fader.mSurfaceValue.mMidiBinding
    .setInputPort(midiInput)
    .bindToPitchBend(this.instance)

  this.fader_touch = surface.makeButton(fader_x + 1, fader_y, 1, 1)
  this.fader_touch.mSurfaceValue.mMidiBinding
    .setInputPort(midiInput)
    .bindToNote(0, 104 + this.instance)

  // Channel Buittons
  this.sel_button = surface.makeButton(fader_x + 1, fader_y + 4, 1, 1)
  this.sel_button.mSurfaceValue.mMidiBinding
    .setInputPort(midiInput)
    .setOutputPort(midiOutput)
    .bindToNote(0, 24 + this.instance)

  this.mute_button = surface.makeButton(fader_x + 1, fader_y + 5, 1, 1)
  this.mute_button.mSurfaceValue.mMidiBinding
    .setInputPort(midiInput)
    .bindToNote(0, 16 + this.instance)

  this.solo_button = surface.makeButton(fader_x + 1, fader_y + 6, 1, 1)
  this.solo_button.mSurfaceValue.mMidiBinding
    .setInputPort(midiInput)
    .bindToNote(0, 8 + this.instance)

  this.rec_button = surface.makeButton(fader_x + 1, fader_y + 7, 1, 1)
  this.rec_button.mSurfaceValue.mMidiBinding
    .setInputPort(midiInput)
    .bindToNote(0, 0 + this.instance)
}

// channelControl.prototype.setSelLedOn = function (value) {
//   this.vSelLedOn = value;
// }

// channelControl.prototype.sendSelLed = function (context) {
//   this.midiOutput.sendMidi(context, [0x90, this.instance + 24, this.vSelLedOn]);
// }

module.exports = {
  channelControl
}
