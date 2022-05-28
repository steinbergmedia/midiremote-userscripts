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

function repeatCommand(activeDevice, command, repeats) {
  for (var i = 0; i < repeats; i++) {
      command.setProcessValue(activeDevice, 1)
  }
}
/**
 * @param {MR_PushEncoder} pushEncoder
 * @param {MR_SurfaceCustomValueVariable} commandIncrease
 * @param {MR_SurfaceCustomValueVariable} commandDecrease
 */
 function bindCommandKnob(pushEncoder, commandIncrease, commandDecrease) {
  // console.log('from script: createCommandKnob')
  pushEncoder.mEncoderValue.mOnProcessValueChange = function (activeDevice, value) {
      console.log('value changed: ' + value)
      if (value < 0.5) {
          var jump_rate = Math.floor(value * 127)
          repeatCommand(activeDevice, commandIncrease, jump_rate)
      } else if (value > 0.5) {
          var jump_rate = Math.floor((value - 0.5) * 127)
          repeatCommand(activeDevice, commandDecrease, jump_rate)
      }
  }
}

function makeTransport(surface, x, y) {
  var transport = {}
  var w = 1
  var h = 1

  function bindMidiNote(button, chn, num) {
      button.mSurfaceValue.mMidiBinding.setInputPort(midiInput).bindToNote(chn, num)
  }

  transport.prevChn = makeLedButton(surface, 48,  x, y, w, h)
  transport.nextChn = makeLedButton(surface, 49,  x + 1, y, w, h)

  // TODO Not implemented yet - not sure what to use them for
  // TODO Perhaps Change the Page in the midi remote??
  transport.prevBnk = makeLedButton(surface, 46, x, y + 1, w, h)
  // TODO Not implemented yet - not sure what to use them for
  transport.nextBnk = makeLedButton(surface, 47, x + 1, y + 1, w, h)

  transport.btnRewind = makeLedButton(surface, 91, x, y + 2, w, h)
  transport.btnForward = makeLedButton(surface, 92, x + 1, y + 2, w, h)

  transport.btnStart = makeLedButton(surface, 94, x, y + 3, w, h)
  transport.btnStop = makeLedButton(surface, 93, x + 1, y + 3, w, h)

  transport.btnRecord = makeLedButton(surface, 95, x, y + 4, w, h)
  transport.btnCycle = makeLedButton(surface, 86, x + 1, y + 4, w, h)

  // The Note on/off events for the special functioans are timestamped at the same time
  // cubase midi remote doesn't show anything on screen though a note is sent
  // Flip - Simultaneous press of Pre Chn+Pre Bank
  transport.btnFlip = surface.makeButton(x + 3, y + 4, 1, 1)
  bindMidiNote(transport.btnFlip, 0, 50)

  // Pressing the Zoom keys simultaneously will toggle on and off a note event. If on
  // either zoom button will send a Note 100 when zoom is activated or deactivated by either button
  // If zoom is active and you simply press then other button the event will not be sent
  //
  transport.btnZoomOnOff = surface.makeButton(x + 4, y + 4, 1, 1)
  bindMidiNote(transport.btnZoomOnOff, 0, 100)

  // The Jog wheel will change CC/Note based on which of thte Zoom buttons have been activated
  // None - CC 60
  // Vertical - Note Clockwise  97, CounterClockwise 96
  // Horizontal - Note Clockwise  99, CounterClockwise 98
  // The Jog wheel is an endless encoder but the surface Push Encoder is control value 0-127
  // In this case it pays to use the Absolute binding type as the Platform M+ produces a rate based
  // CC value - turn clockwise slowly -> 1, turn it rapidly -> 7 (counter clockwise values are offset by 50, turn CCW slowly -> 51)
  // In the Jog (or more correctly Nudge Cursor) mapping we use this to "tap the key severel times" - giving the impact of fine grain control if turned slowly
  // or large nudges if turned quickly.
  // ? One weird side effect of this is the Knob displayed in Cubase will show its "value" in a weird way.
  // todo I wonder if there is a way to change that behaviour?

  transport.jog_wheel = surface.makePushEncoder(x, y + 6, 2, 2)
  transport.jog_wheel.mEncoderValue.mMidiBinding
      .setInputPort(midiInput)
      .bindToControlChange(0, 60)
      .setTypeAbsolute()
  transport.jog_wheel.mPushValue.mMidiBinding
      .setInputPort(midiInput)
      .bindToNote(0, 101)

  //Zoom Vertical
  transport.zoomVertOut = surface.makeButton(x + 3, y + 6, 1, 1).setShapeCircle()
  bindMidiNote(transport.zoomVertOut, 0, 96)
  transport.zoomVertIn = surface.makeButton(x + 4, y + 6, 1, 1).setShapeCircle()
  bindMidiNote(transport.zoomVertIn, 0, 97)

  //Zoom Horizontal
  transport.zoomHorizOut = surface.makeButton(x + 3, y + 7, 1, 1).setShapeCircle()
  bindMidiNote(transport.zoomHorizOut, 0, 98)
  transport.zoomHorizIn = surface.makeButton(x + 4, y + 7, 1, 1).setShapeCircle()
  bindMidiNote(transport.zoomHorizIn, 0, 99)

  return transport
}

module.exports = {
  channelControl,
  masterControl,
  makeLedButton,
  makeTouchFader,
  makeTransport,
  bindCommandKnob
}
