// Icon Platform M+ midi Remote
// Robert Woodcock
//
// Portions of this implementation where inspired by other midi remote creates to whom I wish to say thank you!
// - Mackie C4 by Ron Garrison <ron.garrison@gmail.com> https://github.com/rwgarrison/midiremote-userscripts

var sw_rev = '0.0.0'

var iconElements = require('./icon_elements.js');
var channelControl = iconElements.channelControl;
var masterControl = iconElements.masterControl;
var makeLedButton = iconElements.makeLedButton;

//-----------------------------------------------------------------------------
// 1. DRIVER SETUP - create driver object, midi ports and detection information
//-----------------------------------------------------------------------------

// get the api's entry point
var midiremote_api = require('midiremote_api_v1')

// create the device driver main object
var deviceDriver = midiremote_api.makeDeviceDriver('Icon', 'Platform Mplus', 'Big Fat Wombats')

// create objects representing the hardware's MIDI ports
var midiInput = deviceDriver.mPorts.makeMidiInput()
var midiOutput = deviceDriver.mPorts.makeMidiOutput()

// define all possible namings the devices MIDI ports could have
// NOTE: Windows and MacOS handle port naming differently
deviceDriver.makeDetectionUnit().detectPortPair(midiInput, midiOutput)
    .expectInputNameEquals('Platform M+ V2.15') // Platform M+ v2.15 PlatformMonOut
    .expectOutputNameEquals('Platform M+ V2.15') // Platform M+ v2.15 PlatformMonIn
.
var surface = deviceDriver.mSurface

//-----------------------------------------------------------------------------
// 2. SURFACE LAYOUT - create control elements and midi bindings
//-----------------------------------------------------------------------------

/**
 * @param {MR_PushEncoder} pushEncoder
 * @param {MR_SurfaceCustomValueVariable} commandIncrease
 * @param {MR_SurfaceCustomValueVariable} commandDecrease
 */
function createCommandKnob(pushEncoder, commandIncrease, commandDecrease) {
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

function makeTransport(x, y) {
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

function makeSurfaceElements() {
    var surfaceElements = {}

    surfaceElements.numStrips = 8

    surfaceElements.channelControls = {}

    var xKnobStrip = 0
    var yKnobStrip = 0

    for (var i = 0; i < surfaceElements.numStrips; ++i) {
        surfaceElements.channelControls[i] = new channelControl(surface, midiInput, midiOutput, xKnobStrip, yKnobStrip, i)
    }

    surfaceElements.faderMaster = new masterControl(surface, midiInput, midiOutput, xKnobStrip+1, yKnobStrip, surfaceElements.numStrips)
    surfaceElements.transport = makeTransport(xKnobStrip + 20, yKnobStrip + 3)

    return surfaceElements
}

var surfaceElements = makeSurfaceElements()

//-----------------------------------------------------------------------------
// 3. HOST MAPPING - create mapping defaultPages and host bindings
//-----------------------------------------------------------------------------

var defaultPage = deviceDriver.mMapping.makePage('Default')

defaultPage.makeCommandBinding(surfaceElements.transport.zoomVertIn.mSurfaceValue, 'Zoom', 'Zoom In Vertically')
defaultPage.makeCommandBinding(surfaceElements.transport.zoomVertOut.mSurfaceValue, 'Zoom', 'Zoom Out Vertically')

defaultPage.makeCommandBinding(surfaceElements.transport.zoomHorizIn.mSurfaceValue, 'Zoom', 'Zoom In')
defaultPage.makeCommandBinding(surfaceElements.transport.zoomHorizOut.mSurfaceValue, 'Zoom', 'Zoom Out')

// Transport controls
defaultPage.makeCommandBinding(surfaceElements.transport.prevChn.mSurfaceValue, 'Transport', 'Locate Previous Marker')
defaultPage.makeCommandBinding(surfaceElements.transport.nextChn.mSurfaceValue, 'Transport', 'Locate Next Marker')
defaultPage.makeCommandBinding(surfaceElements.transport.prevBnk.mSurfaceValue, 'Transport', 'Set Punch In Position')
defaultPage.makeCommandBinding(surfaceElements.transport.nextBnk.mSurfaceValue, 'Transport', 'Set Punch Out Position')
defaultPage.makeValueBinding(surfaceElements.transport.btnForward.mSurfaceValue, defaultPage.mHostAccess.mTransport.mValue.mForward)
defaultPage.makeValueBinding(surfaceElements.transport.btnRewind.mSurfaceValue, defaultPage.mHostAccess.mTransport.mValue.mRewind)
defaultPage.makeValueBinding(surfaceElements.transport.btnStart.mSurfaceValue, defaultPage.mHostAccess.mTransport.mValue.mStart).setTypeToggle()
defaultPage.makeValueBinding(surfaceElements.transport.btnStop.mSurfaceValue, defaultPage.mHostAccess.mTransport.mValue.mStop).setTypeToggle()
defaultPage.makeValueBinding(surfaceElements.transport.btnRecord.mSurfaceValue, defaultPage.mHostAccess.mTransport.mValue.mRecord).setTypeToggle()
defaultPage.makeValueBinding(surfaceElements.transport.btnCycle.mSurfaceValue, defaultPage.mHostAccess.mTransport.mValue.mCycleActive).setTypeToggle()

// Jog Knob
// TODO This is still passing midi events through. It's unclear how to stop the midi CC messages passing through?
var jogLeftVariable = deviceDriver.mSurface.makeCustomValueVariable('jogLeft')
var jogRightVariable = deviceDriver.mSurface.makeCustomValueVariable('jogRight')

defaultPage.makeCommandBinding(jogLeftVariable, 'Transport', 'Nudge Cursor Left')
defaultPage.makeCommandBinding(jogRightVariable, 'Transport', 'Nudge Cursor Right')

createCommandKnob(surfaceElements.transport.jog_wheel, jogRightVariable, jogLeftVariable);

function repeatCommand(activeDevice, command, repeats) {
    for (var i = 0; i < repeats; i++) {
        command.setProcessValue(activeDevice, 1)
    }
}

// Mixer
var hostMixerBankZone = defaultPage.mHostAccess.mMixConsole.makeMixerBankZone()
    .excludeOutputChannels()
    .excludeInputChannels()

for(var channelIndex = 0; channelIndex < 8; ++channelIndex) {
    var hostMixerBankChannel = hostMixerBankZone.makeMixerBankChannel()

    var knobSurfaceValue = surfaceElements.channelControls[channelIndex].pushEncoder.mEncoderValue;
    var knobPushValue = surfaceElements.channelControls[channelIndex].pushEncoder.mPushValue;
    var faderSurfaceValue = surfaceElements.channelControls[channelIndex].fader.mSurfaceValue;
    var sel_buttonSurfaceValue = surfaceElements.channelControls[channelIndex].sel_button.mSurfaceValue;
    var mute_buttonSurfaceValue = surfaceElements.channelControls[channelIndex].mute_button.mSurfaceValue;
    var solo_buttonSurfaceValue = surfaceElements.channelControls[channelIndex].solo_button.mSurfaceValue;
    var rec_buttonSurfaceValue = surfaceElements.channelControls[channelIndex].rec_button.mSurfaceValue;

    defaultPage.makeValueBinding(knobSurfaceValue, hostMixerBankChannel.mValue.mPan)
    defaultPage.makeValueBinding(knobPushValue, hostMixerBankChannel.mValue.mInstrumentOpen).setTypeToggle()
    defaultPage.makeValueBinding(faderSurfaceValue, hostMixerBankChannel.mValue.mVolume)
    defaultPage.makeValueBinding(sel_buttonSurfaceValue, hostMixerBankChannel.mValue.mSelected)
    defaultPage.makeValueBinding(mute_buttonSurfaceValue, hostMixerBankChannel.mValue.mMute).setTypeToggle()
    defaultPage.makeValueBinding(solo_buttonSurfaceValue, hostMixerBankChannel.mValue.mSolo).setTypeToggle()
    defaultPage.makeValueBinding(rec_buttonSurfaceValue, hostMixerBankChannel.mValue.mRecordEnable).setTypeToggle()
}

// Master Fader
// If there is only One output it will be Main
// ? If there is more than one then this will be the first one
var ouputMixerBanks = defaultPage.mHostAccess.mMixConsole.makeMixerBankZone().includeOutputChannels()
var outputMixerBankChannels  = ouputMixerBanks.makeMixerBankChannel()
defaultPage.makeValueBinding( surfaceElements.faderMaster.fader.mSurfaceValue, outputMixerBankChannels.mValue.mVolume)
// ? Or connect to headphones
// defaultPage.makeValueBinding( surfaceElements.faderMaster.fader.mSurfaceValue, defaultPage.mHostAccess.mControlRoom.getPhonesChannelByIndex(0).mLevelValue)

// ? Would be nice to use the read and write buttons as read and write automation for selected track - but haven't figured out how to code that yet
defaultPage.makeValueBinding( surfaceElements.faderMaster.mixer_button.mSurfaceValue, defaultPage.mHostAccess.mTransport.mValue.mMetronomeActive).setTypeToggle()
defaultPage.makeValueBinding( surfaceElements.faderMaster.read_button.mSurfaceValue,  defaultPage.mHostAccess.mControlRoom.mMainChannel.mDimActiveValue).setTypeToggle()
defaultPage.makeValueBinding( surfaceElements.faderMaster.write_button.mSurfaceValue, defaultPage.mHostAccess.mControlRoom.mMainChannel.mReferenceLevelEnabledValue).setTypeToggle()