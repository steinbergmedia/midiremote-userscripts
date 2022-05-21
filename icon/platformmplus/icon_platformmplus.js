//-----------------------------------------------------------------------------
// 1. DRIVER SETUP - create driver object, midi ports and detection information
//-----------------------------------------------------------------------------

// get the api's entry point
var midiremote_api = require('midiremote_api_v1')

// create the device driver main object
var deviceDriver = midiremote_api.makeDeviceDriver('Icon', 'PlatformMPlus', 'Big Fat Wombat')

// create objects representing the hardware's MIDI ports
var midiInput = deviceDriver.mPorts.makeMidiInput()
var midiOutput = deviceDriver.mPorts.makeMidiOutput()

// define all possible namings the devices MIDI ports could have
// NOTE: Windows and MacOS handle port naming differently
deviceDriver.makeDetectionUnit().detectPortPair(midiInput, midiOutput)
    .expectInputNameEquals('PlatformMonOut') // Platform M+ v2.15
    .expectOutputNameEquals('PlatformMonIn') // Platform M+ v2.15

var surface = deviceDriver.mSurface

//-----------------------------------------------------------------------------
// 2. SURFACE LAYOUT - create control elements and midi bindings
//-----------------------------------------------------------------------------

function makeKnobStrip(knobIndex, x, y) {
    var knobStrip = {}

    knobStrip.knob = surface.makeKnob(x + 2 * knobIndex, y, 1, 1)
    knobStrip.knob.mSurfaceValue.mMidiBinding.setInputPort(midiInput).bindToControlChange(0, 16 + knobIndex).setTypeRelativeSignedBit()

    return knobStrip
}

function makeFaderStrip(channelIndex, x, y) {
    var faderStrip = {}

    // Fader + Fader Touch
    faderStrip.fader = surface.makeFader(x + 2 * channelIndex, y, 1, 8).setTypeVertical()
    faderStrip.fader.mSurfaceValue.mMidiBinding.setInputPort(midiInput).bindToPitchBend(channelIndex)

    faderStrip.touched = surface.makeButton(x + 1+ 2 * channelIndex, y, 1, 1)
    faderStrip.touched.mSurfaceValue.mMidiBinding.setInputPort(midiInput).bindToNote(0, 104 + channelIndex)

    // Channel Buittons
    faderStrip.sel_button = surface.makeButton(x + 1 + 2 * channelIndex, y + 4, 1, 1)
    faderStrip.sel_button.mSurfaceValue.mMidiBinding.setInputPort(midiInput).bindToNote(0, 24 + channelIndex)

    faderStrip.mute_button = surface.makeButton(x + 1 + 2 * channelIndex, y + 5, 1, 1)
    faderStrip.mute_button.mSurfaceValue.mMidiBinding.setInputPort(midiInput).bindToNote(0, 16 + channelIndex)

    faderStrip.solo_button = surface.makeButton(x + 1 + 2 * channelIndex, y + 6, 1, 1)
    faderStrip.solo_button.mSurfaceValue.mMidiBinding.setInputPort(midiInput).bindToNote(0, 8 + channelIndex)

    faderStrip.rec_button = surface.makeButton(x + 1 + 2 * channelIndex, y + 7, 1, 1)
    faderStrip.rec_button.mSurfaceValue.mMidiBinding.setInputPort(midiInput).bindToNote(0, 0 + channelIndex)

    return faderStrip
}

function makeTransport(x, y) {
    var transport = {}

    var w = 1
    var h = 1

    function bindMidiNote(button, chn, num) {
        button.mSurfaceValue.mMidiBinding.setInputPort(midiInput).bindToNote(chn, num)
    }

    transport.prevChn = surface.makeButton(x, y, w, h)
    bindMidiNote(transport.prevChn, 0, 48)
    transport.nextChn = surface.makeButton(x+1, y, w, h)
    bindMidiNote(transport.nextChn, 0, 49)

    transport.prevBnk = surface.makeButton(x, y+1, w, h)
    bindMidiNote(transport.prevBnk, 0, 46)
    transport.nextBnk = surface.makeButton(x+1, y+1, w, h)
    bindMidiNote(transport.nextBnk, 0, 47)

    transport.btnRewind = surface.makeButton(x, y+2, w, h)
    bindMidiNote(transport.btnRewind, 0, 91)
    transport.btnForward = surface.makeButton(x+1, y+2, w, h)
    bindMidiNote(transport.btnForward, 0, 92)

    transport.btnStart = surface.makeButton(x, y+3, w, h)
    bindMidiNote(transport.btnStart, 0, 94)
    transport.btnStop = surface.makeButton(x+1, y+3, w, h)
    bindMidiNote(transport.btnStop, 0, 93)

    transport.btnRecord = surface.makeButton(x, y+4, w, h)
    bindMidiNote(transport.btnRecord, 0, 95)
    transport.btnCycle = surface.makeButton(x+1, y+4, w, h)
    bindMidiNote(transport.btnCycle, 0, 86)

    //jog wheel
    transport.jog_wheel = surface.makeKnob(x, y + 6, 2, 2)
    transport.jog_wheel.mSurfaceValue.mMidiBinding.setInputPort(midiInput).bindToControlChange(0, 60).setTypeRelativeSignedBit()
    transport.btnJog = surface.makeButton(x,y+8,2,1)
    bindMidiNote(transport.btnJog, 0, 101)

    return transport
}

function makeSurfaceElements() {
    var surfaceElements = {}

    surfaceElements.numStrips = 8

    surfaceElements.knobStrips = {}
    surfaceElements.faderStrips = {}

    var xKnobStrip = 0
    var yKnobStrip = 0

    for(var i = 0; i < surfaceElements.numStrips; ++i) {
        surfaceElements.knobStrips[i] = makeKnobStrip(i, xKnobStrip, yKnobStrip)
        surfaceElements.faderStrips[i] = makeFaderStrip(i, xKnobStrip, yKnobStrip+2)
    }

    surfaceElements.transport = makeTransport(20, 3)

    return surfaceElements
}

var surfaceElements = makeSurfaceElements()


//-----------------------------------------------------------------------------
// 3. HOST MAPPING - create mapping pages and host bindings
//-----------------------------------------------------------------------------