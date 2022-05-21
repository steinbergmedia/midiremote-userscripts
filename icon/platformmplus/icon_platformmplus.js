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
    .expectInputNameEquals('PlatformMonOut')
    .expectOutputNameEquals('PlatformMonIn')

deviceDriver.makeDetectionUnit().detectPortPair(midiInput, midiOutput)
    .expectInputNameEquals('PlatformMonOut')
    .expectOutputNameEquals('PlatformMonIn')


//-----------------------------------------------------------------------------
// 2. SURFACE LAYOUT - create control elements and midi bindings
//-----------------------------------------------------------------------------

// create control element representing your hardware's surface
var knob1 = deviceDriver.mSurface.makeKnob(0, 0, 1, 1.5)
var knob2 = deviceDriver.mSurface.makeKnob(1, 0, 1, 1.5)
var knob3 = deviceDriver.mSurface.makeKnob(2, 0, 1, 1.5)
var knob4 = deviceDriver.mSurface.makeKnob(3, 0, 1, 1.5)

// bind midi ports to surface elements
knob1.mSurfaceValue.mMidiBinding
    .setInputPort(midiInput)
    .setOutputPort(midiOutput)
    .bindToControlChange (0, 16).setTypeRelativeSignedBit()

knob2.mSurfaceValue.mMidiBinding
    .setInputPort(midiInput)
    .setOutputPort(midiOutput)
    .bindToControlChange (0, 17).setTypeRelativeSignedBit()

knob3.mSurfaceValue.mMidiBinding
    .setInputPort(midiInput)
    .setOutputPort(midiOutput)
    .bindToControlChange (0, 18).setTypeRelativeSignedBit()

knob4.mSurfaceValue.mMidiBinding
    .setInputPort(midiInput)
    .setOutputPort(midiOutput)
    .bindToControlChange (0, 19).setTypeRelativeSignedBit()

//-----------------------------------------------------------------------------
// 3. HOST MAPPING - create mapping pages and host bindings
//-----------------------------------------------------------------------------

// create at least one mapping page
var page = deviceDriver.mMapping.makePage('Example Knobs Page')

// create host accessing objects
var hostSelectedTrackChannel = page.mHostAccess.mTrackSelection.mMixerChannel


// bind surface elements to host accessing object values
page.makeValueBinding(knob1.mSurfaceValue, hostSelectedTrackChannel.mValue.mVolume)
page.makeValueBinding(knob2.mSurfaceValue, hostSelectedTrackChannel.mSends.getByIndex(0).mLevel)
page.makeValueBinding(knob3.mSurfaceValue, hostSelectedTrackChannel.mSends.getByIndex(1).mLevel)
page.makeValueBinding(knob4.mSurfaceValue, hostSelectedTrackChannel.mSends.getByIndex(2).mLevel)
