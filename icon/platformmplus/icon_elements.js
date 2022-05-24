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
 * @param {MR_DeviceSurface} surface
 * @param {MR_DeviceMidiInput} midiInput
 * @param {Number} channel    - instance of the push encoder.
 * @param {number} x           - x location of the push encoder in the gui
 * @param {Number} y           - y location of the push encoder in the gui
 * @param {Number} w           - width of the push encoder.
 * @param {Number} h           - height of the push encoder.
 */
function makeTouchFader(surface, midiInput, midiOutput, channel, x, y, w, h) {
  // Fader + Fader Touch
  var fader = surface.makeFader(x, y, w, h).setTypeVertical()
  fader.mSurfaceValue.mMidiBinding
    .setInputPort(midiInput)
    .setOutputPort(midiOutput)
    .bindToPitchBend(channel)

  var fader_touch = surface.makeButton(x + 1, y, 1, 1)
  fader_touch.mSurfaceValue.mMidiBinding
    .setInputPort(midiInput)
    .bindToNote(0, 104 + channel)

  return [fader,fader_touch]
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
  var tf = makeTouchFader(surface, midiInput, this.midiOutput, instance, fader_x, fader_y, 1, 8)
  this.fader = tf[0]
  this.fader_touch = tf[1]

  // Channel Buttons
  this.sel_button = makeLedButton(surface, 24 + this.instance, fader_x + 1, fader_y + 4, 1, 1)
  this.mute_button = makeLedButton(surface, 16 + this.instance, fader_x + 1, fader_y + 5, 1, 1)
  this.solo_button = makeLedButton(surface, 8 + this.instance, fader_x + 1, fader_y + 6, 1, 1)
  this.rec_button = makeLedButton(surface, 0 + this.instance, fader_x + 1, fader_y + 7, 1, 1)

}

/**
 * @param {MR_DeviceSurface} surface
 * @param {MR_DeviceMidiInput} midiInput
 * @param {MR_DeviceMidiOutput} midiOutput
 * @param {number} x           - x location of the push encoder in the gui
 * @param {Number} y           - y location of the push encoder in the gui
 * @param {Number} w           - width of the push encoder.
 * @param {Number} h           - height of the push encoder.
 * @param {Number} instance    - instance of the push encoder.
 */
 function masterControl(surface, midiInput, midiOutput, x, y, instance) {
  // Position on GUI
  this.surface = surface;
  this.midiInput = midiInput;
  this.midiOutput = midiOutput;
  this.x = x + 2 * instance;
  this.y = y;
  this.instance = instance; // 9 - Master

  this.ident = function () {
    return ("Class masterControl");
  }

  // Fader + Fader Touch
  var fader_x = this.x
  var fader_y = y + 3
  var tf = makeTouchFader(surface, midiInput, midiOutput, instance, fader_x, fader_y, 1, 8)
  this.fader = tf[0]
  this.fader_touch = tf[1]

  // Channel Buttons
  this.mixer_button = makeLedButton(surface, 84, fader_x + 1, fader_y + 4, 1, 1)
  this.read_button = makeLedButton(surface, 74, fader_x + 1, fader_y + 5, 1, 1)
  this.write_button = makeLedButton(surface, 75, fader_x + 1, fader_y + 6, 1, 1)

}

module.exports = {
  channelControl,
  masterControl,
  makeLedButton,
  makeTouchFader
}
