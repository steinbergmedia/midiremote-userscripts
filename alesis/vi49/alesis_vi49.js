//-----------------------------------------------------------------------------
// 1. DRIVER SETUP - create driver object, midi ports and detection information
//-----------------------------------------------------------------------------

// get the api's entry point
var midiremote_api = require('midiremote_api_v1')

// create the device driver main object
var deviceDriver = midiremote_api.makeDeviceDriver('Alesis', 'VI49', 'MH')

// create objects representing the hardware's MIDI ports
var midiInput = deviceDriver.mPorts.makeMidiInput()
var midiOutput = deviceDriver.mPorts.makeMidiOutput()

// define all possible namings the devices MIDI ports could have
// NOTE: Windows and MacOS handle port naming differently
deviceDriver.makeDetectionUnit().detectPortPair(midiInput, midiOutput)
    .expectInputNameEquals('VI49')
    .expectOutputNameEquals('VI49')    

//-----------------------------------------------------------------------------
// 2. SURFACE LAYOUT - create control elements and midi bindings
//-----------------------------------------------------------------------------
var surface = deviceDriver.mSurface

var keyboard = {}
keyboard.knobs = {}
keyboard.knobs.num = 12
keyboard.knobs.channel = 0
keyboard.buttons = {}
keyboard.buttons.rows = 3
keyboard.buttons.channel = 1
keyboard.buttons.cc = [
    48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59,
    64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75,
    80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91,
]
keyboard.pads = {}
keyboard.pads.num = 16
keyboard.pads.channel = 1
keyboard.pads.note = [
    48, 49, 50, 51,
    44, 45, 46, 47,
    40, 41, 42, 43,
    36, 37, 38, 39,
]



function makeKnobs(x, y, w, h, num, channel) {
    var knobs = []
    for (var i = 0; i < num; i++) {
        var knob = surface.makeKnob(i * w + x, y, w, h)
        knob.mSurfaceValue.mMidiBinding.setInputPort(midiInput).setOutputPort(midiOutput).bindToControlChange(channel, i + 20)
        knobs[i] = knob  
    }
    return knobs
}

function makeButtons(x, y, w, h, channel) {
    var buttons = []
    for (var row = 0; row < keyboard.buttons.rows; row++) {
        for (var i = 0; i < keyboard.knobs.num; i++) {
            var button = surface.makeButton(i * w + x, row * h + y, w, h)
            button.mSurfaceValue.mMidiBinding.setInputPort(midiInput).setOutputPort(midiOutput).bindToControlChange(channel, keyboard.buttons.cc[row * 12 + i])
            buttons.push(button)
        }
    }
    return buttons
}

function makePads(x, y, w, h, channel) {
    var pads = []
    for (var row = 0; row < 4; row++) {
        for (var i = 0; i < 4; i++) {
            var pad = surface.makeTriggerPad(i * w + x, row * h + y, w, h)
            pad.mSurfaceValue.mMidiBinding.setInputPort(midiInput).setOutputPort(midiOutput).bindToNote(channel, keyboard.pads.note[row * 4 + i])
            pads.push(pad)
        }
    }
    return pads
}

function makeTransport(x, y) {
    var transport = {}
    function mkButton(x, y, w, h, cc) {
        var button = {}
        button = surface.makeButton(x, y, w, h)
        button.mSurfaceValue.mMidiBinding.setInputPort(midiInput).setOutputPort(midiOutput).bindToControlChange(0, cc)        
        return button
    }    
    transport.rewind = mkButton(x, y, 1, 0.7, 116)
    transport.forward = mkButton(x + 1, y, 1, 0.7, 117)
    transport.stop = mkButton(x + 2, y, 1, 0.7, 118)
    transport.play = mkButton(x + 3, y, 1, 0.7, 119)
    transport.cycle = mkButton(x + 4, y, 1, 0.7, 115)
    transport.record = mkButton(x + 5, y, 1, 0.7, 114)
    return transport
}

function makeSurfaceElements(){
    var surfaceElements = {}
    surfaceElements.knobs = makeKnobs(11, 0, 1.2, 2, keyboard.knobs.num, keyboard.knobs.channel)
    surfaceElements.buttons = makeButtons(11, 1.5, 1.2, 0.7, keyboard.buttons.channel)
    surfaceElements.pads = makePads(0, 4, 1, 1, keyboard.pads.channel)
    surfaceElements.transport = makeTransport(4, 2.5)
    surfaceElements.pb = surface.makeBlindPanel(0, 0, 0.75, 2)
    surfaceElements.mw = surface.makeBlindPanel(1, 0, 0.75, 2)
    surfaceElements.piano = surface.makePianoKeys(4, 4, 24, 4, 0, 48)
    return surfaceElements
}

var surfaceElements = makeSurfaceElements()
//-----------------------------------------------------------------------------
// 3. HOST MAPPING - create mapping pages and host bindings
//-----------------------------------------------------------------------------

var page = deviceDriver.mMapping.makePage('Default')
//Knobs
var knobs = surfaceElements.knobs
for (var i = 0; i < 8; i++) {
    var knobSurfaceValue = knobs[i].mSurfaceValue
    page.makeValueBinding(knobSurfaceValue, page.mHostAccess.mFocusedQuickControls.getByIndex(i)).setValueTakeOverModePickup()
}
page.makeValueBinding(knobs[8].mSurfaceValue, page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mVolume).setValueTakeOverModePickup()
page.makeValueBinding(knobs[9].mSurfaceValue, page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mPan).setValueTakeOverModePickup()
page.makeValueBinding(knobs[10].mSurfaceValue, page.mHostAccess.mTrackSelection.mMixerChannel.mSends.getByIndex(0).mLevel).setValueTakeOverModePickup()
page.makeValueBinding(knobs[11].mSurfaceValue, page.mHostAccess.mTrackSelection.mMixerChannel.mSends.getByIndex(1).mLevel).setValueTakeOverModePickup()

//Transport
var transport = surfaceElements.transport
page.makeValueBinding(transport.rewind.mSurfaceValue, page.mHostAccess.mTransport.mValue.mRewind)
page.makeValueBinding(transport.forward.mSurfaceValue, page.mHostAccess.mTransport.mValue.mForward)
page.makeValueBinding(transport.stop.mSurfaceValue, page.mHostAccess.mTransport.mValue.mStop).setTypeToggle()
page.makeValueBinding(transport.play.mSurfaceValue, page.mHostAccess.mTransport.mValue.mStart).setTypeToggle()
page.makeValueBinding(transport.cycle.mSurfaceValue, page.mHostAccess.mTransport.mValue.mCycleActive).setTypeToggle()
page.makeValueBinding(transport.record.mSurfaceValue, page.mHostAccess.mTransport.mValue.mRecord).setTypeToggle()


//Pads
var pads = surfaceElements.pads
page.makeCommandBinding(pads[0].mSurfaceValue, 'Mixer', 'Bypass: Inserts')
page.makeCommandBinding(pads[1].mSurfaceValue, 'Mixer', 'Bypass: EQs')
page.makeCommandBinding(pads[2].mSurfaceValue, 'Mixer', 'Bypass: Channel Strip')
page.makeCommandBinding(pads[3].mSurfaceValue, 'Mixer', 'Bypass: Sends')

page.makeCommandBinding(pads[4].mSurfaceValue, 'Devices', 'Mixer')
page.makeCommandBinding(pads[5].mSurfaceValue, 'Editors', 'Open/Close Editor')
page.makeActionBinding(pads[6].mSurfaceValue, page.mHostAccess.mTrackSelection.mAction.mPrevTrack)
page.makeActionBinding(pads[7].mSurfaceValue, page.mHostAccess.mTrackSelection.mAction.mNextTrack)

page.makeValueBinding(pads[8].mSurfaceValue, page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mMute).setTypeToggle()
page.makeValueBinding(pads[9].mSurfaceValue, page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mSolo).setTypeToggle()
page.makeValueBinding(pads[10].mSurfaceValue, page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mAutomationRead).setTypeToggle()
page.makeValueBinding(pads[11].mSurfaceValue, page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mAutomationWrite).setTypeToggle()

page.makeValueBinding(pads[12].mSurfaceValue, page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mRecordEnable).setTypeToggle()
page.makeValueBinding(pads[13].mSurfaceValue, page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mMonitorEnable).setTypeToggle()
page.makeValueBinding(pads[14].mSurfaceValue, page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mEditorOpen).setTypeToggle()
page.makeValueBinding(pads[15].mSurfaceValue, page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mInstrumentOpen).setTypeToggle()


//Switches
var buttons = surfaceElements.buttons
page.makeCommandBinding(buttons[0].mSurfaceValue, 'Transport', 'To Marker 1')
page.makeCommandBinding(buttons[1].mSurfaceValue, 'Transport', 'To Marker 2')
page.makeCommandBinding(buttons[2].mSurfaceValue, 'Transport', 'To Marker 3')
page.makeCommandBinding(buttons[3].mSurfaceValue, 'Transport', 'To Marker 4')
page.makeCommandBinding(buttons[4].mSurfaceValue, 'Transport', 'To Marker 5')
page.makeCommandBinding(buttons[5].mSurfaceValue, 'Transport', 'To Marker 6')
page.makeCommandBinding(buttons[6].mSurfaceValue, 'Transport', 'To Marker 7')
page.makeCommandBinding(buttons[7].mSurfaceValue, 'Transport', 'To Marker 8')
page.makeCommandBinding(buttons[8].mSurfaceValue, 'Transport', 'To Marker 9')
