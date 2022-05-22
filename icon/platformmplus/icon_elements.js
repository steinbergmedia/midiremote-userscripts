/**
 * @param {MR_DeviceSurface} surface
 * @param {String} name
 * @param {number} note
 * @param {Boolean} toggle
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 *
 */
 function makeLedButton(surface, note, x, y, w, h) {
  var button = surface.makeButton(x, y, w, h)
  button.mSurfaceValue.mMidiBinding.setInputPort(midiInput).bindToNote(0, note)
  button.mSurfaceValue.mOnProcessValueChange = (function (activeDevice, value) {
  if (value > 0)
    this.midiOutput.sendMidi(activeDevice, [0x90, note, 127])
  else {
    this.midiOutput.sendMidi(activeDevice, [0x90, note, 0])
      }
  }).bind({ midiOutput })
  return button
}

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

  // Channel Buttons
  this.sel_button = makeLedButton(surface, 24 + this.instance, fader_x + 1, fader_y + 4, 1, 1)
  this.mute_button = makeLedButton(surface, 16 + this.instance, fader_x + 1, fader_y + 5, 1, 1)
  this.solo_button = makeLedButton(surface, 8 + this.instance, fader_x + 1, fader_y + 6, 1, 1)
  this.sel_button = makeLedButton(surface, 0 + this.instance, fader_x + 1, fader_y + 7, 1, 1)

}

module.exports = {
  channelControl,
  makeLedButton
}
