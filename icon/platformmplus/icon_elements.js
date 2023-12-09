var helper = require('./helper')
var makeLabel = helper.display.makeLabel
var setTextOfColumn = helper.display.setTextOfColumn
var setTextOfLine = helper.display.setTextOfLine

function _sendDisplayData(row, text, activeDevice, midiOutput) {
  var lenText = text.length < 56 ? text.length : 56
  var data = [0xf0, 0x00, 0x00, 0x66, 0x14, 0x12]
  var out = data.concat(56 * row) // Row 1 offset

  for (var i = 0; i < lenText; ++i)
    out.push(text.charCodeAt(i))
  while (lenText++ < 56)
    out.push(0x20) // spaces for the rest
  out.push(0xf7)
  midiOutput.sendMidi(activeDevice, out)

}

function Helper_updateDisplay(/** @type {string} */idRow1, /** @type {string} */idRow2, /** @type {string} */idAltRow1, /** @type {string} */idAltRow2,/** @type {MR_ActiveDevice} */activeDevice, /** @type {MR_DeviceMidiOutput} */midiOutput) {
  // console.log("Helper Update Display")
  // Display ids
  activeDevice.setState('Display - idRow1', idRow1)
  activeDevice.setState('Display - idRow2', idRow2)
  activeDevice.setState('Display - idAltRow1', idAltRow1)
  activeDevice.setState('Display - idAltRow2', idAltRow2)
  // console.log("Display ids update: " + idRow1+"::"+idRow2)
  // console.log("Display ids update: " + idAltRow1+"::"+idAltRow2)
  // New display values
  var newRow1 = activeDevice.getState(idRow1)
  var newRow2 = activeDevice.getState(idRow2)
  var newAltRow1 = activeDevice.getState(idAltRow1)
  var newAltRow2 = activeDevice.getState(idAltRow2)
  // Previous values
  var prevRow1 = activeDevice.getState('Row1')
  var prevRow2 = activeDevice.getState('Row2')
  var prevAltRow1 = activeDevice.getState('AltRow1')
  var prevAltRow2 = activeDevice.getState('AltRow2')
  var activeDisplayType = activeDevice.getState('activeDisplayType')
  // Display Fader or Panner values
  var displayType = activeDevice.getState("displayType")

  if (displayType === "Pan") {
    // Update display if it has changed
    if ((newAltRow1 !== prevAltRow1) || (newAltRow2 !== prevAltRow2) || (activeDisplayType !== displayType)) {
      // console.log("AltRows Display prev: " + prevAltRow1+"::"+prevAltRow2)
      // console.log("AltRows Display new: " + newAltRow1+"::"+newAltRow2)
      _sendDisplayData(1, newAltRow1, activeDevice, midiOutput)
      _sendDisplayData(0, newAltRow2, activeDevice, midiOutput)
    }
  } else {
    // Update display if it has changed
    if ((newRow1 !== prevRow1) || (newRow2 !== prevRow2) || (activeDisplayType !== displayType)) {
      // console.log("Rows Display prev" + prevRow1+"::"+prevRow2)
      // console.log("Rows Display new" + newRow1+"::"+newRow2)
      _sendDisplayData(1, newRow1, activeDevice, midiOutput)
      _sendDisplayData(0, newRow2, activeDevice, midiOutput)
    }
  }
  // Update Active display state
  activeDevice.setState('Row1', newRow1)
  activeDevice.setState('Row2', newRow2)

  activeDevice.setState('AltRow1', newAltRow1)
  activeDevice.setState('AltRow2', newAltRow2)

  activeDevice.setState('activeDisplayType', displayType)
  // console.log("Helper Update Display...DONE")

  // Indicators for the Zoom and Jog function subpages
  function display_indicator(row, indicator) {
    var data = [0xf0, 0x00, 0x00, 0x66, 0x14, 0x12,
    ]
    if (row === 0) {
      data.push(55)
    } else {
      data.push(111)
    }
    data.push(indicator.charCodeAt(0))
    data.push(0xf7)
    midiOutput.sendMidi(activeDevice, data)
  }

  var indicator1 = activeDevice.getState("indicator1")
  var indicator2 = activeDevice.getState("indicator2")

  display_indicator(1, indicator1)
  display_indicator(0, indicator2)
}


/**
 * @param {MR_DeviceSurface} surface
 * @param {MR_DeviceMidiInput} midiInput
 * @param {MR_DeviceMidiOutput} midiOutput
 * @param {number} note
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {boolean} circle
 */
function makeLedButton(surface, midiInput, midiOutput, note, x, y, w, h, circle) {
  var button = surface.makeButton(x, y, w, h)
  button.mSurfaceValue.mMidiBinding.setIsConsuming(true).setInputPort(midiInput).bindToNote(0, note)
  if (circle) {
    button.setShapeCircle()
  }
  button.mSurfaceValue.mOnProcessValueChange = (function (/** @type {MR_ActiveDevice} */activeDevice) {
    // console.log("LedButton ProcessValue Change:"+button.mSurfaceValue.getProcessValue(activeDevice))
    var value = button.mSurfaceValue.getProcessValue(activeDevice)
    this.midiOutput.sendMidi(activeDevice, [0x90, note, value])

  }).bind({ midiOutput })
  return button
}

function clearAllLeds(/** @type {MR_ActiveDevice} */activeDevice, /** @type {MR_DeviceMidiOutput} */midiOutput) {
  // console.log('Clear All Leds')
  // Mixer buttons
  for (var i = 0; i < 8; ++i) {
    midiOutput.sendMidi(activeDevice, [0x90, 24 + i, 0])
    midiOutput.sendMidi(activeDevice, [0x90, 16 + i, 0])
    midiOutput.sendMidi(activeDevice, [0x90, 8 + i, 0])
    midiOutput.sendMidi(activeDevice, [0x90, 0 + i, 0])
  }
  // Master Fader buttons
  midiOutput.sendMidi(activeDevice, [0x90, 84, 0]) // Mixer
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

  // helper.display.reset(activeDevice, midiOutput)
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

  // !!! Important !!!
  // Test for the existing TouchState feature
  // to make the script compatible with Cubase 12 as well
  if(fader.mSurfaceValue.mTouchState) {
    // create a custom value variable to bind agains the touch state midi message
    var fader_touch = surface.makeCustomValueVariable('faderTouch'+channel.toString())
    fader_touch.mMidiBinding.setInputPort(midiInput).bindToNote(0, 104 + channel)

    // bind the custom value variable to the TouchState member. (new in API 1.1)
    fader.mSurfaceValue.mTouchState.bindTo(fader_touch)
  }

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
    // console.log('value changed: ' + value)
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
 * @param {number} y           - y location of the push encoder in the gui
 * @param {number} instance    - instance of the push encoder.
 * @param {Object} surfaceElements
 * @returns {Object}
 */
function makeChannelControl(surface, midiInput, midiOutput, x, y, instance, surfaceElements) {
  var channelControl = {}
  channelControl.surface = surface;
  channelControl.midiInput = midiInput;
  channelControl.midiOutput = midiOutput;
  channelControl.x = x + 7 * instance;
  channelControl.y = y;
  channelControl.instance = instance; // Channel number, 1-8

  // Pot encoder
  channelControl.pushEncoder = channelControl.surface.makePushEncoder(channelControl.x, y + 2, 4, 4)

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

  channelControl.fader.mSurfaceValue.mOnTitleChange = (function (activeDevice, objectTitle, valueTitle) {
    // console.log("Fader Title Change: " + this.channelIndex + "::" + objectTitle + ":" + valueTitle)
    var activePage = activeDevice.getState("activePage")
    var activeSubPage = activeDevice.getState("activeSubPage")
    var faderTitles = activeDevice.getState(activePage + "- " + activeSubPage + ' - Fader - Title')
    var faderValueTitles = activeDevice.getState(activePage + "- " + activeSubPage + ' - Fader - ValueTitles')
    // console.log("Fader Title Change Page: " + activePage + "::" + activeSubPage)
    switch (activePage) {
      case "Midi":
        // MIDI Page is special since it uses a separate midi port and completely separate display and MIDI routing setup
        // This update of the display is simply to ensure that should this event be received (which it is during init for example) then
        // the Midi display state values won't be overwritten as they are handed by the custom onValueChange call in the page
        Helper_updateDisplay(activePage + "- " + activeSubPage + ' - Fader - ValueTitles', activePage + "- " + activeSubPage + ' - Fader - Values', activePage + "- " + activeSubPage + ' - Pan - ValueTitles', activePage + "- " + activeSubPage + ' - Pan - Values', activeDevice, this.midiOutput)
        break;
      case "ChannelStrip":
      case "SelectedTrack":
        activeDevice.setState(activePage + "- " + activeSubPage + ' - Fader - ValueTitles', setTextOfColumn(this.channelIndex, makeLabel(valueTitle, 6), faderValueTitles))
        Helper_updateDisplay(activePage + "- " + activeSubPage + ' - Fader - ValueTitles', activePage + "- " + activeSubPage + ' - Fader - Values', activePage + "- " + activeSubPage + ' - Pan - ValueTitles', activePage + "- " + activeSubPage + ' - Pan - Values', activeDevice, this.midiOutput)
        break;
      default:
        activeDevice.setState(activePage + "- " + activeSubPage + ' - Fader - Title', setTextOfColumn(this.channelIndex, makeLabel(objectTitle, 6), faderTitles))
        activeDevice.setState(activePage + "- " + activeSubPage + ' - Fader - ValueTitles', setTextOfColumn(this.channelIndex, makeLabel(valueTitle, 6), faderValueTitles))
        Helper_updateDisplay(activePage + "- " + activeSubPage + ' - Fader - Title', activePage + "- " + activeSubPage + ' - Fader - Values', activePage + "- " + activeSubPage + ' - Pan - Title', activePage + "- " + activeSubPage + ' - Pan - Values', activeDevice, this.midiOutput)
        break;
    }
  }).bind({ channelIndex, midiOutput })

  channelControl.fader.mSurfaceValue.mOnDisplayValueChange = (function (activeDevice, value, units) {
    var activePage = activeDevice.getState("activePage")
    var activeSubPage = activeDevice.getState("activeSubPage")
    var faderValues = activeDevice.getState(activePage + "- " + activeSubPage + ' - Fader - Values')

    // console.log("Fader Display Value Change: " + value + ":" + activePage)

    // ? When adjusting the AI fader in Mixer mode there is no update to the other fader even if you adjust that fader with the AI control
    // ? When adjusting the AI fader in SelectedChannel mode there IS an update to the other fader, so...
    // ! Disable the update if the display in on MasterFader
    if (activeDevice.getState('Display - idRow1') !== 'MasterFader - Title') {
      switch (activePage) {
        case "Midi":
          break;
        default:
          activeDevice.setState(activePage + "- " + activeSubPage + ' - Fader - Values', setTextOfColumn(channelIndex, makeLabel(value, 6), faderValues))
          Helper_updateDisplay(activeDevice.getState('Display - idRow1'), activePage + "- " + activeSubPage + ' - Fader - Values', activeDevice.getState('Display - idAltRow1'), activeDevice.getState('Display - idAltRow2'), activeDevice, midiOutput)
          break;
      }
    }

  }).bind({ midiOutput, channelIndex })

  channelControl.pushEncoder.mEncoderValue.mOnTitleChange = (function (activeDevice, objectTitle, valueTitle) {
    // console.log("Pan Title Changed:" + objectTitle + ":" + valueTitle)
    var activePage = activeDevice.getState("activePage")
    var activeSubPage = activeDevice.getState("activeSubPage")
    var panTitles = activeDevice.getState(activePage + "- " + activeSubPage + ' - Pan - Title')
    var panValueTitles = activeDevice.getState(activePage + "- " + activeSubPage + ' - Pan - ValueTitles')
    // WIP This switch logic needs refactoring - it is repeated (and thus error prone) for pushEncoder and fader mOnTileChange
    switch (activePage) {
      case "Midi":
        // MIDI Page is special since it uses a separate midi port and completely separate display and MIDI routing setup
        // This update of the display is simply to ensure that should this event be received (which it is during init for example) then
        // the Midi display state values won't be overwritten as they are handed by the custom onValueChange call in the page
        Helper_updateDisplay(activePage + "- " + activeSubPage + ' - Fader - ValueTitles', activePage + "- " + activeSubPage + ' - Fader - Values', activePage + "- " + activeSubPage + ' - Pan - ValueTitles', activePage + "- " + activeSubPage + ' - Pan - Values', activeDevice, midiOutput)
        break;
      case "ChannelStrip":
      case "SelectedTrack":
        switch (activeSubPage) {
          case "SendsQC":
            var title = objectTitle.slice(2)
            if (title.length === 0) {
              title = "None"
            }
            activeDevice.setState(activePage + "- " + activeSubPage + ' - Pan - ValueTitles', setTextOfColumn(channelIndex, makeLabel(title, 6), panValueTitles))
            Helper_updateDisplay(activePage + "- " + activeSubPage + ' - Fader - ValueTitles', activePage + "- " + activeSubPage + ' - Fader - Values', activePage + "- " + activeSubPage + ' - Pan - ValueTitles', activePage + "- " + activeSubPage + ' - Pan - Values', activeDevice, midiOutput)
            break;
          default:
            var title = valueTitle
            if (title.length === 0) {
              title = "None"
            }
            activeDevice.setState(activePage + "- " + activeSubPage + ' - Pan - ValueTitles', setTextOfColumn(channelIndex, makeLabel(title, 6), panValueTitles))
            Helper_updateDisplay(activePage + "- " + activeSubPage + ' - Fader - ValueTitles', activePage + "- " + activeSubPage + ' - Fader - Values', activePage + "- " + activeSubPage + ' - Pan - ValueTitles', activePage + "- " + activeSubPage + ' - Pan - Values', activeDevice, midiOutput)
            break;
        }
        break;
      default:
        activeDevice.setState(activePage + "- " + activeSubPage + ' - Pan - Title', setTextOfColumn(channelIndex, makeLabel(objectTitle, 6), panTitles))
        activeDevice.setState(activePage + "- " + activeSubPage + ' - Pan - ValueTitles', setTextOfColumn(channelIndex, makeLabel(valueTitle, 6), panValueTitles))
        Helper_updateDisplay(activePage + "- " + activeSubPage + ' - Fader - Title', activePage + "- " + activeSubPage + ' - Fader - Values', activePage + "- " + activeSubPage + ' - Pan - Title', activePage + "- " + activeSubPage + ' - Pan - Values', activeDevice, midiOutput)
        break;
    }

  }).bind({ midiOutput, channelIndex })

  channelControl.pushEncoder.mEncoderValue.mOnDisplayValueChange = (function (activeDevice, value, units) {
    // console.log("Pan Value Change: " + value + ":" + units)
    var activePage = activeDevice.getState("activePage")
    var activeSubPage = activeDevice.getState("activeSubPage")
    var panValues = activeDevice.getState(activePage + "- " + activeSubPage + ' - Pan - Values')

    activeDevice.setState(activePage + "- " + activeSubPage + ' - Pan - Values', setTextOfColumn(channelIndex, makeLabel(value, 6), panValues))
    Helper_updateDisplay(activeDevice.getState('Display - idRow1'), activeDevice.getState('Display - idRow2'), activeDevice.getState('Display - idAltRow1'), activePage + "- " + activeSubPage + ' - Pan - Values', activeDevice, midiOutput)

  }).bind({ midiOutput, channelIndex })

  return channelControl

}

/**
 * @param {MR_DeviceSurface} surface
 * @param {MR_DeviceMidiInput} midiInput
 * @param {MR_DeviceMidiOutput} midiOutput
 * @param {number} x           - x location of the push encoder in the gui
 * @param {number} y           - y location of the push encoder in the gui
 * @param {number} instance    - instance of the push encoder.
 * @param {Object} surfaceElements
 * @returns {Object}
 */
function makeMasterControl(surface, midiInput, midiOutput, x, y, instance, surfaceElements) {
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

  masterControl.fader.mSurfaceValue.mOnTitleChange = (function (activeDevice, objectTitle, valueTitle) {
    // console.log("Fader Title Change: " + channelIndex + "::" + objectTitle + ":" + valueTitle)
    var title = objectTitle ? objectTitle + ":" + valueTitle : "No AI Parameter under mouse"
    activeDevice.setState('MasterFader - Title', title)

  })

  masterControl.fader.mSurfaceValue.mOnDisplayValueChange = (function (activeDevice, value, units) {

    activeDevice.setState('MasterFader - Values', value + units)
    // console.log("MasterFader Display Value Change: " + value + ":" + units)
    // Check to see if we are in the correct display mode - otherwise don't display
    // ! This isn't done via the touch value as the touch onProcessValueChange may be processed after the mOnDisplayValueChange
    if (activeDevice.getState('Display - idRow1') === 'MasterFader - Title') {
      Helper_updateDisplay('MasterFader - Title', 'MasterFader - Values', 'MasterFader - Title', 'MasterFader - Values', activeDevice, midiOutput)
    }
  }).bind({ midiOutput })

  masterControl.fader_touch.mOnProcessValueChange = (function (activeDevice, touched, value2) {
    // console.log("masterFader Touch Change: " + touched + ":" + value2)
    // value===-1 means touch released
    if (value2 == -1) {
      // Reset the display to previous values
      Helper_updateDisplay(activeDevice.getState('MasterFader - stashRow1'),
        activeDevice.getState('MasterFader - stashRow2'),
        activeDevice.getState('MasterFader - stashAltRow1'),
        activeDevice.getState('MasterFader - stashAltRow2'),
        activeDevice, midiOutput)
    } else {
      // Stash previous display state
      // console.log("masterFader stash: " + activeDevice.getState('Display - idAltRow1') + ":" + activeDevice.getState('Display - idAltRow2'))
      activeDevice.setState('MasterFader - stashRow1', activeDevice.getState('Display - idRow1'))
      activeDevice.setState('MasterFader - stashRow2', activeDevice.getState('Display - idRow2'))
      activeDevice.setState('MasterFader - stashAltRow1', activeDevice.getState('Display - idAltRow1'))
      activeDevice.setState('MasterFader - stashAltRow2', activeDevice.getState('Display - idAltRow2'))
      Helper_updateDisplay('MasterFader - Title', 'MasterFader - Values', 'MasterFader - Title', 'MasterFader - Values', activeDevice, midiOutput)
    }
  }).bind({ midiOutput })

  // Channel Buttons
  masterControl.mixer_button = makeLedButton(surface, midiInput, midiOutput, 84, fader_x + 3, fader_y + 6, 3, 3, false)
  masterControl.read_button = makeLedButton(surface, midiInput, midiOutput, 74, fader_x + 3, fader_y + 9, 3, 3, false)
  masterControl.write_button = makeLedButton(surface, midiInput, midiOutput, 75, fader_x + 3, fader_y + 12, 3, 3, false)

  return masterControl
}

/**
 * @param {MR_DeviceSurface} surface
 * @param {MR_DeviceMidiInput} midiInput
 * @param {MR_DeviceMidiOutput} midiOutput
 * @param {number} x
 * @param {number} y
 * @param {Object} surfaceElements
 * @returns {Object}
 */
function makeTransport(surface, midiInput, midiOutput, x, y, surfaceElements) {
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

  // The Note on/off events for the special functions are timestamped at the same time
  // cubase midi remote doesn't show anything on screen though a note is sent
  // Flip - Simultaneous press of Pre Chn+Pre Bank
  transport.btnFlip = surface.makeButton(x + 0.5, y + 15, 2, 2).setShapeCircle()
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
  clearAllLeds,
  Helper_updateDisplay
}
