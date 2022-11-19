var helper = require('./helper')
/**
 * @param {MR_DeviceSurface} surface
 * @param {String} name
 * @param {number} note
 * @param {Boolean} toggle
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {boolean} circle
 */
function makeLedButton(surface, midiInput, midiOutput, note, x, y, w, h, circle) {
  var button = surface.makeButton(x, y, w, h)
  button.mSurfaceValue.mMidiBinding.setInputPort(midiInput).bindToNote(0, note)
  if (circle) {
    button.setShapeCircle()
  }
  button.mSurfaceValue.mOnProcessValueChange = function (activeDevice) {
    if (button.mSurfaceValue.getProcessValue(activeDevice) > 0)
      midiOutput.sendMidi(activeDevice, [0x90, note, 127])
    else {
      midiOutput.sendMidi(activeDevice, [0x90, note, 0])
    }
  }
  return button
}

function clearAllLeds(activeDevice, midiOutput) {
  console.log('Clear All Leds')
  // Mixer buttons
  for (var i = 0; i < 8; ++i) {
    midiOutput.sendMidi(activeDevice, [0x90, 24 + i, 0])
    midiOutput.sendMidi(activeDevice, [0x90, 16 + i, 0])
    midiOutput.sendMidi(activeDevice, [0x90, 8 + i, 0])
    midiOutput.sendMidi(activeDevice, [0x90, 0 + i, 0])
  }
  // Master Fader buttons
  midiOutput.sendMidi(activeDevice, [0x90, 84, 0])
  midiOutput.sendMidi(activeDevice, [0x90, 74, 0])
  midiOutput.sendMidi(activeDevice, [0x90, 75, 0])

  // Transport Buttons
  midiOutput.sendMidi(activeDevice, [0x90, 48, 0])
  midiOutput.sendMidi(activeDevice, [0x90, 49, 0])
  midiOutput.sendMidi(activeDevice, [0x90, 46, 0])
  midiOutput.sendMidi(activeDevice, [0x90, 47, 0])
  midiOutput.sendMidi(activeDevice, [0x90, 91, 0])
  midiOutput.sendMidi(activeDevice, [0x90, 92, 0])
  midiOutput.sendMidi(activeDevice, [0x90, 93, 0])
  midiOutput.sendMidi(activeDevice, [0x90, 94, 0])
  midiOutput.sendMidi(activeDevice, [0x90, 95, 0])
  midiOutput.sendMidi(activeDevice, [0x90, 86, 0])

  helper.display.reset(activeDevice, midiOutput)
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

  return [fader, fader_touch]
}

function repeatCommand(activeDevice, command, repeats) {
  for (var i = 0; i < repeats; i++) {
    command.setProcessValue(activeDevice, 1)
  }
}

/**
 * @param {MR_SurfaceElementValue} pushEncoder
 * @param {MR_SurfaceCustomValueVariable} commandIncrease
 * @param {MR_SurfaceCustomValueVariable} commandDecrease
 */
function bindCommandKnob(pushEncoder, commandIncrease, commandDecrease) {
  // console.log('from script: createCommandKnob')
  pushEncoder.mOnProcessValueChange = function (activeDevice, value) {
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
 function makeChannelControl(surface, midiInput, midiOutput, x, y, instance) {
  var channelControl = {}
  channelControl.surface = surface;
  channelControl.midiInput = midiInput;
  channelControl.midiOutput = midiOutput;
  channelControl.x = x + 7 * instance;
  channelControl.y = y;
  channelControl.instance = instance; // Channel number, 1-8

  // Channel Displays
  channelControl.displayTop = channelControl.surface.makeLabelField(channelControl.x,1,7,2)
  channelControl.displayBottom =  channelControl.surface.makeLabelField(channelControl.x,3,7,2)

  channelControl.faderValueDisplay  = channelControl.surface.makeCustomValueVariable('faderValueDisplay');
  channelControl.panValueDisplay  = channelControl.surface.makeCustomValueVariable('panValueDisplay');

  // Pot encoder
  channelControl.pushEncoder = channelControl.surface.makePushEncoder(channelControl.x, y+2, 4, 4)

  channelControl.pushEncoder.mEncoderValue.mMidiBinding
    .setInputPort(midiInput)
    .bindToControlChange(0, 16 + channelControl.instance)
    .setTypeRelativeSignedBit()

  channelControl.pushEncoder.mPushValue.mMidiBinding
    .setInputPort(midiInput)
    .bindToNote(0, 32 + channelControl.instance);

  // Fader + Fader Touch
  var fader_x = channelControl.x
  var fader_y = y + 7
  var tf = makeTouchFader(surface, midiInput, channelControl.midiOutput, instance, fader_x, fader_y, 3, 18)
  channelControl.fader = tf[0]
  channelControl.fader_touch = tf[1]

  // Channel Buttons
  channelControl.sel_button = makeLedButton(surface, midiInput, midiOutput, 24 + channelControl.instance, fader_x + 4, fader_y + 6, 3, 3, false)
  channelControl.mute_button = makeLedButton(surface, midiInput, midiOutput, 16 + channelControl.instance, fader_x + 4, fader_y + 9, 3, 3, false)
  channelControl.solo_button = makeLedButton(surface, midiInput, midiOutput, 8 + channelControl.instance, fader_x + 4, fader_y + 12, 3, 3, false)
  channelControl.rec_button = makeLedButton(surface, midiInput, midiOutput, 0 + channelControl.instance, fader_x + 4, fader_y + 15, 3, 3, true)

  var channelIndex = channelControl.instance

  // channelControl.fader.mSurfaceValue.mOnTitleChange = function (context, objectTitle, valueTitle) {
  //   midiOutput.sendMidi(context, helper.sysex.displaySetTextOfColumn(channelIndex, 1, makeLabel(objectTitle)))
  //   midiOutput.sendMidi(context, helper.sysex.displaySetTextOfColumn(channelIndex, 0, makeLabel(valueTitle)))
  // }

  channelControl.faderValueDisplay.mOnTitleChange = function (context, objectTitle, valueTitle) {
    midiOutput.sendMidi(context, helper.sysex.displaySetTextOfColumn(channelIndex, 1, makeLabel(objectTitle)))
    midiOutput.sendMidi(context, helper.sysex.displaySetTextOfColumn(channelIndex, 0, makeLabel(valueTitle)))
  }

  channelControl.faderValueDisplay.mOnDisplayValueChange = function (context, value, units) {
    midiOutput.sendMidi(context, helper.sysex.displaySetTextOfColumn(channelIndex, 0, "|"+makeLabel(value)))
  }
  // channelControl.panValueDisplay.mOnTitleChange = function (context, objectTitle, valueTitle) {
  //   midiOutput.sendMidi(context, helper.sysex.displaySetTextOfColumn(channelIndex, 1, makeLabel(objectTitle)))
  //   midiOutput.sendMidi(context, helper.sysex.displaySetTextOfColumn(channelIndex, 0, makeLabel(valueTitle)))
  // }

  // channelControl.panValueDisplay.mOnDisplayValueChange = function (context, value, units) {
  //   midiOutput.sendMidi(context, helper.sysex.displaySetTextOfColumn(channelIndex, 0, "_"+makeLabel(value)))
  // }

  function makeLabel(value) {
    // Do nothing if the label is already short enough
    if (value.length <= 6) {
      return value
    }

    // If to long shorten it by removing vowels and making it CamelCase to remove spaces
    var words = value.split(" ");
    var label = "";

    for(var i = 0 , len = words.length; i < len; i++) {

      var currentStr = words[i];

      var tempStr = currentStr

      // convert first letter to upper case and remove all vowels after first letter
      tempStr = tempStr.substr(0, 1).toUpperCase() + tempStr.substr(1).replace(/[aeiou]/gi, '');

      label +=tempStr;

    }
    return label.slice(0, 6); // Remove vowels and shorten to 6 char label
  }

  return channelControl

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
function makeMasterControl(surface, midiInput, midiOutput, x, y, instance) {
  var masterControl = {}
  masterControl.surface = surface;
  masterControl.midiInput = midiInput;
  masterControl.midiOutput = midiOutput;
  masterControl.x = x + 7 * instance;
  masterControl.y = y;
  masterControl.instance = instance; // 9 - Master

  masterControl.ident = function () {
    return ("Class masterControl");
  }

  // Fader + Fader Touch
  var fader_x = masterControl.x
  var fader_y = y + 3
  var tf = makeTouchFader(surface, midiInput, midiOutput, instance, fader_x, fader_y, 3, 18)
  masterControl.fader = tf[0]
  masterControl.fader_touch = tf[1]

  // Channel Buttons
  masterControl.mixer_button = makeLedButton(surface, midiInput, midiOutput, 84, fader_x + 3, fader_y + 6, 3, 3, false)
  masterControl.read_button = makeLedButton(surface, midiInput, midiOutput, 74, fader_x + 3, fader_y + 9, 3, 3, false)
  masterControl.write_button = makeLedButton(surface, midiInput, midiOutput, 75, fader_x + 3, fader_y + 12, 3, 3, false)

  return masterControl
}

function makeTransport(surface, midiInput, midiOutput, x, y) {
  var transport = {}
  transport.surface = surface;
  transport.midiInput = midiInput;
  transport.midiOutput = midiOutput;
  transport.x = x;
  transport.y = y;

  var w = 3
  var h = 3

  transport.ident = function () {
    return ("Class Transport");
  }

  function bindMidiNote(button, chn, num) {
    button.mSurfaceValue.mMidiBinding.setInputPort(midiInput).bindToNote(chn, num)
  }

  transport.prevChn = makeLedButton(surface, midiInput, midiOutput, 48, x, y, w, h, false)
  transport.nextChn = makeLedButton(surface, midiInput, midiOutput, 49, x + 3, y, w, h, false)

  transport.prevBnk = makeLedButton(surface, midiInput, midiOutput, 46, x, y + 3, w, h, false)
  transport.nextBnk = makeLedButton(surface, midiInput, midiOutput, 47, x + 3, y + 3, w, h, false)

  transport.btnRewind = makeLedButton(surface, midiInput, midiOutput, 91, x, y + 6, w, h, false)
  transport.btnForward = makeLedButton(surface, midiInput, midiOutput, 92, x + 3, y + 6, w, h, false)

  transport.btnStop = makeLedButton(surface, midiInput, midiOutput, 93, x + 3, y + 9, w, h, false)
  transport.btnStart = makeLedButton(surface, midiInput, midiOutput, 94, x, y + 9, w, h, false)

  transport.btnRecord = makeLedButton(surface, midiInput, midiOutput, 95, x, y + 12, w, h, false)
  transport.btnCycle = makeLedButton(surface, midiInput, midiOutput, 86, x + 3, y + 12, w, h, false)

  // The Note on/off events for the special functioans are timestamped at the same time
  // cubase midi remote doesn't show anything on screen though a note is sent
  // Flip - Simultaneous press of Pre Chn+Pre Bank
  transport.btnFlip = surface.makeButton(x+0.5, y + 15, 2, 2).setShapeCircle()
  bindMidiNote(transport.btnFlip, 0, 50)

  // Pressing the Zoom keys simultaneously will toggle on and off a note event. If on
  // either zoom button will send a Note 100 when zoom is activated or deactivated by either button
  // If zoom is active and you simply press then other button the event will not be sent
  //
  transport.btnZoomOnOff = surface.makeButton(x + 3.5, y + 15, 2, 2).setShapeCircle()
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

  transport.jog_wheel = surface.makePushEncoder(x, y + 17, 6, 6)
  transport.jog_wheel.mEncoderValue.mMidiBinding
    .setInputPort(midiInput)
    .setIsConsuming(true)
    .bindToControlChange(0, 60)
    .setTypeAbsolute()
  transport.jog_wheel.mPushValue.mMidiBinding
    .setInputPort(midiInput)
    .bindToNote(0, 101)
  // ? This is still passing midi events through. It's unclear how to stop the midi CC messages passing through other then removing the MIDI port from All In
  transport.jogLeftVariable = surface.makeCustomValueVariable('jogLeft')
  transport.jogRightVariable = surface.makeCustomValueVariable('jogRight')

  bindCommandKnob(transport.jog_wheel.mEncoderValue, transport.jogRightVariable, transport.jogLeftVariable);

  //Zoom Vertical
  transport.zoomVertOut = surface.makeButton(x + 9, y + 8, 2, 2).setShapeCircle()
  bindMidiNote(transport.zoomVertOut, 0, 96)
  transport.zoomVertIn = surface.makeButton(x + 11, y + 8, 2, 2).setShapeCircle()
  bindMidiNote(transport.zoomVertIn, 0, 97)

  //Zoom Horizontal
  transport.zoomHorizOut = surface.makeButton(x + 9, y + 10, 2, 2).setShapeCircle()
  bindMidiNote(transport.zoomHorizOut, 0, 98)
  transport.zoomHorizIn = surface.makeButton(x + 11, y + 10, 2, 2).setShapeCircle()
  bindMidiNote(transport.zoomHorizIn, 0, 99)

  return transport
}

module.exports = {
  makeChannelControl,
  makeMasterControl,
  makeTransport,
  makeLedButton,
  makeTouchFader,
  bindCommandKnob,
  clearAllLeds
}
