//-----------------------------------------------------------------------------
// 1. DRIVER SETUP - create driver object, midi ports and detection information
//-----------------------------------------------------------------------------

// get the api's entry point
var midiremote_api = require('midiremote_api_v1')

// create the device driver main object
var deviceDriver = midiremote_api.makeDeviceDriver('ExampleCompany', 'PutASmileOnYourSurface', 'Steinberg Media Technologies GmbH')

// create objects representing the hardware's MIDI ports
var midiInput = deviceDriver.mPorts.makeMidiInput()
var midiOutput = deviceDriver.mPorts.makeMidiOutput()

// define all possible namings the devices MIDI ports could have
// NOTE: Windows and MacOS handle port naming differently
deviceDriver.makeDetectionUnit().detectPortPair(midiInput, midiOutput)
    .expectInputNameEquals('SmileDevice IN')
    .expectOutputNameEquals('SmileDevice OUT')
    
deviceDriver.makeDetectionUnit().detectPortPair(midiInput, midiOutput)
    .expectInputNameEquals('SmileDevice (MIDI IN)')
    .expectOutputNameEquals('SmileDevice (MIDI OUT)')


//-----------------------------------------------------------------------------
// 2. SURFACE LAYOUT - create control elements and midi bindings
//-----------------------------------------------------------------------------

// create control element representing your hardware's surface

deviceDriver.mSurface.makeBlindPanel(0, 0, 6, 6).setShapeCircle()

var knob1 = deviceDriver.mSurface.makeKnob(0.75, 3.25, 1, 1.5)
var knob2 = deviceDriver.mSurface.makeKnob(1.50, 4.00, 1, 1.5)
var knob3 = deviceDriver.mSurface.makeKnob(2.50, 4.25, 1, 1.5)
var knob4 = deviceDriver.mSurface.makeKnob(3.50, 4.00, 1, 1.5)
var knob5 = deviceDriver.mSurface.makeKnob(4.25, 3.25, 1, 1.5)
var knob6 = deviceDriver.mSurface.makeKnob(1.00, 1.15, 2, 2)
var knob7 = deviceDriver.mSurface.makeKnob(3.00, 1.15, 2, 2)

// bind midi ports to surface elements
knob1.mSurfaceValue.mMidiBinding
    .setInputPort(midiInput)
    .setOutputPort(midiOutput)
    .bindToControlChange (0, 21) // channel 0, cc 21

knob2.mSurfaceValue.mMidiBinding
    .setInputPort(midiInput)
    .setOutputPort(midiOutput)
    .bindToControlChange (0, 22) // channel 0, cc 22

knob3.mSurfaceValue.mMidiBinding
    .setInputPort(midiInput)
    .setOutputPort(midiOutput)
    .bindToControlChange (0, 23) // channel 0, cc 23

knob4.mSurfaceValue.mMidiBinding
    .setInputPort(midiInput)
    .setOutputPort(midiOutput)
    .bindToControlChange (0, 24) // channel 0, cc 24

//-----------------------------------------------------------------------------
// 3. HOST MAPPING - create mapping pages and host bindings
//-----------------------------------------------------------------------------

// create at least one mapping page
var page = deviceDriver.mMapping.makePage('Example Mixer Page')

// create host accessing objects
var hostSelectedTrackChannel = page.mHostAccess.mTrackSelection.mMixerChannel


// bind surface elements to host accessing object values
page.makeValueBinding(knob1.mSurfaceValue, hostSelectedTrackChannel.mValue.mVolume)
page.makeValueBinding(knob2.mSurfaceValue, hostSelectedTrackChannel.mSends.getByIndex(0).mLevel)
page.makeValueBinding(knob3.mSurfaceValue, hostSelectedTrackChannel.mSends.getByIndex(1).mLevel)
page.makeValueBinding(knob4.mSurfaceValue, hostSelectedTrackChannel.mSends.getByIndex(2).mLevel)
page.makeValueBinding(knob5.mSurfaceValue, hostSelectedTrackChannel.mSends.getByIndex(3).mLevel)
page.makeValueBinding(knob6.mSurfaceValue, hostSelectedTrackChannel.mValue.mVolume)
page.makeValueBinding(knob7.mSurfaceValue, hostSelectedTrackChannel.mValue.mPan)
