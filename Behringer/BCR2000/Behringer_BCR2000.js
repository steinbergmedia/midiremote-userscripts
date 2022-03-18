//Behringer BCR2000 v 1.5.1 by Giampaolo Gesuale

//-----------------------------------------------------------------------------
// 1. DRIVER SETUP - create driver object, midi ports and detection information
//-----------------------------------------------------------------------------

var midiremote_api = require('midiremote_api_v1')
var deviceDriver = midiremote_api.makeDeviceDriver('Behringer', 'BCR2000', 'Giampaolo Gesuale')

var midiInput = deviceDriver.mPorts.makeMidiInput()
var midiOutput = deviceDriver.mPorts.makeMidiOutput()

deviceDriver.makeDetectionUnit().detectPortPair(midiInput, midiOutput)
    .expectInputNameEquals('BCR2000')
    .expectOutputNameEquals('BCR2000')

//user guide
//deviceDriver.setUserGuide ('BCR2000_midi_remote.pdf') 

//submit bcr preset: to be tested
//midiOutput.sendSysexFile(activeDevice, 'preset.bcr', 5)

//-----------------------------------------------------------------------------
// 2. SURFACE LAYOUT - create control elements and midi bindings
//-----------------------------------------------------------------------------

var surface= deviceDriver.mSurface

//layer zone
var encoderGroups = surface.makeControlLayerZone('Encoder Groups')
var encoderGroup1 = encoderGroups.makeControlLayer('Group 1')
var encoderGroup2 = encoderGroups.makeControlLayer('Group 2')
var encoderGroup3 = encoderGroups.makeControlLayer('Group 3')
var encoderGroup4 = encoderGroups.makeControlLayer('Group 4')

var knobs =[]
var buttons = []

var inarow = 8
var nEncoders = 32
var gruppo = encoderGroup1

//encoders
for(var r = 0; r < nEncoders/inarow; ++r) {
    switch (r){
        case 0: gruppo = encoderGroup1
        break
        case 1: gruppo = encoderGroup2
        break
        case 2: gruppo = encoderGroup3
        break
        case 3: gruppo = encoderGroup4
    }
    for (var c=0; c<inarow; ++c){        
        var knob = surface.makeKnob(c*2, 1, 2, 2)
        knob.setControlLayer(gruppo)
        knob.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput).setOutputPort(midiOutput)
        .bindToControlChange(0, 1+c+r*inarow).setTypeRelativeTwosComplement()
        knobs.push(knob)

        var button = surface.makeButton(c*2, 0, 2, 1)
        button.setControlLayer(gruppo)
        button.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput).setOutputPort(midiOutput)
        .bindToControlChange (0, 33+c+inarow*r)
        buttons.push(button)
    }
}

//buttons
var nbuttons = 16
for(var rb = 0; rb < nbuttons/inarow; ++rb) {
    for (var cb=0; cb<inarow; ++cb){
        var button = surface.makeButton(cb*2, rb+4, 2, 1)
        button.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput).setOutputPort(midiOutput)
        .bindToControlChange (0, 65+cb+inarow*rb)
        buttons.push(button)
    }
}

//knobs
var nknob = 24
for(var rk = 0; rk < nknob/inarow; ++rk) {
    for (var ck=0; ck<inarow; ++ck){
        var knob = surface.makeKnob(ck*2, rk*3+7, 2, 2)
        knob.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput).setOutputPort(midiOutput)
        .bindToControlChange(0, 81+ck+rk*inarow).setTypeRelativeTwosComplement()
        knobs.push(knob)
    }
}

//side buttons
var nbuttonsSide = 4
var inArowSide = 2
for(var rb = 0; rb < nbuttonsSide/inArowSide; ++rb) {
    for (var cb=0; cb<inArowSide; ++cb){
        var button = surface.makeButton(cb*2+18, rb+13, 2, 1)
        button.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput).setOutputPort(midiOutput)
        .bindToControlChange (0, 105+cb+inArowSide*rb)
        buttons.push(button)
    }
}

//footswitches
var nFootButtons = 2
var inArowFoot = 2
for(var rb = 0; rb < nFootButtons/inArowFoot; ++rb) {
    for (var cb=0; cb<inArowFoot; ++cb){
        var button = surface.makeButton(cb*2+18, rb, 2, 1)
        button.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput).setOutputPort(midiOutput)
        .bindToControlChange (0, 109+cb+inArowFoot*rb)
        buttons.push(button)
    }
}

//-----------------------------------------------------------------------------
// 3. HOST MAPPING - create mapping pages and host bindings
//-----------------------------------------------------------------------------

// default page
var page = deviceDriver.mMapping.makePage('Cubase remote')
var page_mix= page.mHostAccess.mTrackSelection.mMixerChannel

var numStrips = 8

for(var stripIndex = 0; stripIndex < numStrips; ++stripIndex) {
	var knob = knobs[stripIndex]
	var button = buttons[stripIndex]
	var knob8 = knobs[stripIndex + 8]
	var button8 = buttons[stripIndex + 8]

	var knob16 = knobs[stripIndex + 16]
	var knob24 = knobs[stripIndex + 24]
	var button24 = buttons[stripIndex + 24]

	var sendSlot = page_mix.mSends.getByIndex(stripIndex)
	var focusQuickControl = page.mHostAccess.mFocusedQuickControls.getByIndex(stripIndex)
	var trackQuickControl = page_mix.mQuickControls.getByIndex(stripIndex)
	var cueSend = page_mix.mCueSends.getByIndex(stripIndex)

	page.makeValueBinding(knob.mSurfaceValue, sendSlot.mLevel)
	page.makeValueBinding(button.mSurfaceValue, sendSlot.mOn).setTypeToggle()
	page.makeValueBinding(knob8.mSurfaceValue, focusQuickControl)
	page.makeValueBinding(button8.mSurfaceValue, focusQuickControl).setTypeToggle()
	page.makeValueBinding(knob16.mSurfaceValue, trackQuickControl)
	page.makeValueBinding(knob24.mSurfaceValue, cueSend.mLevel)
	page.makeValueBinding(button24.mSurfaceValue, cueSend.mOn).setTypeToggle()
}

page.makeValueBinding(buttons[32].mSurfaceValue, page.mHostAccess.mFocusedQuickControls.mFocusLockedValue).setTypeToggle()

//EQ
page.makeValueBinding(knobs[32].mSurfaceValue, page_mix.mChannelEQ.mBand1.mGain)
page.makeValueBinding(knobs[33].mSurfaceValue, page_mix.mChannelEQ.mBand2.mGain)
page.makeValueBinding(knobs[34].mSurfaceValue, page_mix.mChannelEQ.mBand3.mGain)
page.makeValueBinding(knobs[35].mSurfaceValue, page_mix.mChannelEQ.mBand4.mGain)
page.makeValueBinding(knobs[40].mSurfaceValue, page_mix.mChannelEQ.mBand1.mFreq)
page.makeValueBinding(knobs[41].mSurfaceValue, page_mix.mChannelEQ.mBand2.mFreq)
page.makeValueBinding(knobs[42].mSurfaceValue, page_mix.mChannelEQ.mBand3.mFreq)
page.makeValueBinding(knobs[43].mSurfaceValue, page_mix.mChannelEQ.mBand4.mFreq)
page.makeValueBinding(knobs[48].mSurfaceValue, page_mix.mChannelEQ.mBand1.mQ)
page.makeValueBinding(knobs[49].mSurfaceValue, page_mix.mChannelEQ.mBand2.mQ)
page.makeValueBinding(knobs[50].mSurfaceValue, page_mix.mChannelEQ.mBand3.mQ)
page.makeValueBinding(knobs[51].mSurfaceValue, page_mix.mChannelEQ.mBand4.mQ)
page.makeValueBinding(buttons[40].mSurfaceValue, page_mix.mChannelEQ.mBand1.mOn).setTypeToggle()
page.makeValueBinding(buttons[41].mSurfaceValue, page_mix.mChannelEQ.mBand2.mOn).setTypeToggle()
page.makeValueBinding(buttons[42].mSurfaceValue, page_mix.mChannelEQ.mBand3.mOn).setTypeToggle()
page.makeValueBinding(buttons[43].mSurfaceValue, page_mix.mChannelEQ.mBand4.mOn).setTypeToggle()
page.makeValueBinding(knobs[36].mSurfaceValue, page_mix.mPreFilter.mHighCutFreq)
page.makeValueBinding(knobs[44].mSurfaceValue, page_mix.mPreFilter.mLowCutFreq)
page.makeValueBinding(knobs[52].mSurfaceValue, page_mix.mPreFilter.mGain)
page.makeValueBinding(buttons[36].mSurfaceValue, page_mix.mPreFilter.mHighCutOn).setTypeToggle()
page.makeValueBinding(buttons[44].mSurfaceValue, page_mix.mPreFilter.mLowCutOn).setTypeToggle()

//other
page.makeValueBinding(knobs[37].mSurfaceValue, page.mHostAccess.mControlRoom.mMainChannel.mLevelValue)
page.makeValueBinding(knobs[38].mSurfaceValue, page.mHostAccess.mTransport.mValue.mMetronomeClickLevel)
page.makeValueBinding(knobs[39].mSurfaceValue, page_mix.mValue.mPan)
page.makeValueBinding(knobs[55].mSurfaceValue, page_mix.mValue.mVolume)
page.makeValueBinding(buttons[38].mSurfaceValue, page_mix.mValue.mMonitorEnable).setTypeToggle()
page.makeValueBinding(buttons[39].mSurfaceValue, page_mix.mValue.mSolo).setTypeToggle()
page.makeValueBinding(buttons[37].mSurfaceValue, page_mix.mValue.mAutomationRead).setTypeToggle()
page.makeValueBinding(buttons[38].mSurfaceValue, page_mix.mValue.mRecordEnable).setTypeToggle()
page.makeValueBinding(buttons[45].mSurfaceValue, page_mix.mValue.mAutomationWrite).setTypeToggle()
page.makeValueBinding(buttons[46].mSurfaceValue, page_mix.mValue.mMonitorEnable).setTypeToggle()
page.makeValueBinding(buttons[47].mSurfaceValue, page_mix.mValue.mMute).setTypeToggle()
page.makeValueBinding(knobs[54].mSurfaceValue, page.mHostAccess.mMouseCursor.mValueUnderMouse)
page.makeValueBinding(buttons[48].mSurfaceValue, page_mix.mValue.mEditorOpen).setTypeToggle()
page.makeValueBinding(buttons[50].mSurfaceValue, page_mix.mValue.mInstrumentOpen).setTypeToggle()
page.makeActionBinding(buttons[49].mSurfaceValue, page.mHostAccess.mTrackSelection.mAction.mPrevTrack)
page.makeActionBinding(buttons[51].mSurfaceValue, page.mHostAccess.mTrackSelection.mAction.mNextTrack)
