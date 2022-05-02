// Behringer BCR2000 v 1.6 by Giampaolo Gesuale

//-----------------------------------------------------------------------------
// 1. DRIVER SETUP - create driver object, midi ports and detection information
//-----------------------------------------------------------------------------

var midiremote_api = require('midiremote_api_v1')
var deviceDriver = midiremote_api.makeDeviceDriver('behringer', 'bcr2000', 'Giampaolo Gesuale')

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
var selTrackName = surface.makeLabelField(18,2,4,1)
var pagename = surface.makeLabelField(18,12,4,0.9)

var trackNames = []
for (var i = 0; i < 8; ++i){
    var trackName = surface.makeLabelField(i*2,15,2,0.6)
    trackNames.push(trackName)
}


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
var page = deviceDriver.mMapping.makePage('Focus Control')
page.setLabelFieldText(pagename, 'Focus Control')
page.setLabelFieldHostObject(selTrackName, page.mHostAccess.mTrackSelection.mMixerChannel)
var page_focus= page.mHostAccess.mTrackSelection.mMixerChannel

var numStrips = 8

for(var stripIndex = 0; stripIndex < numStrips; ++stripIndex) {
	var knob = knobs[stripIndex]
	var button = buttons[stripIndex]
	var knob8 = knobs[stripIndex + 8]
	var button8 = buttons[stripIndex + 8]

	var knob16 = knobs[stripIndex + 16]
	var knob24 = knobs[stripIndex + 24]
	var button24 = buttons[stripIndex + 24]

	var sendSlot = page_focus.mSends.getByIndex(stripIndex)
	var focusQuickControl = page.mHostAccess.mFocusedQuickControls.getByIndex(stripIndex)
	var trackQuickControl = page_focus.mQuickControls.getByIndex(stripIndex)
	var cueSend = page_focus.mCueSends.getByIndex(stripIndex)

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
var EqSubPageArea = page.makeSubPageArea('EQ area')
var subPageGain = EqSubPageArea.makeSubPage('Gain')
var subPageEqType = EqSubPageArea.makeSubPage('Eq Type')
page.makeActionBinding(buttons[35].mSurfaceValue, EqSubPageArea.mAction.mNext)
page.makeValueBinding(knobs[32].mSurfaceValue, page_focus.mChannelEQ.mBand1.mGain)
page.makeValueBinding(knobs[33].mSurfaceValue, page_focus.mChannelEQ.mBand2.mGain)
page.makeValueBinding(knobs[34].mSurfaceValue, page_focus.mChannelEQ.mBand3.mGain)
page.makeValueBinding(knobs[35].mSurfaceValue, page_focus.mChannelEQ.mBand4.mGain)
page.makeValueBinding(knobs[40].mSurfaceValue, page_focus.mChannelEQ.mBand1.mFreq)
page.makeValueBinding(knobs[41].mSurfaceValue, page_focus.mChannelEQ.mBand2.mFreq)
page.makeValueBinding(knobs[42].mSurfaceValue, page_focus.mChannelEQ.mBand3.mFreq)
page.makeValueBinding(knobs[43].mSurfaceValue, page_focus.mChannelEQ.mBand4.mFreq)
page.makeValueBinding(knobs[48].mSurfaceValue, page_focus.mChannelEQ.mBand1.mFilterType).setSubPage(subPageEqType)
page.makeValueBinding(knobs[49].mSurfaceValue, page_focus.mChannelEQ.mBand2.mFilterType).setSubPage(subPageEqType)
page.makeValueBinding(knobs[50].mSurfaceValue, page_focus.mChannelEQ.mBand3.mFilterType).setSubPage(subPageEqType)
page.makeValueBinding(knobs[51].mSurfaceValue, page_focus.mChannelEQ.mBand4.mFilterType).setSubPage(subPageEqType)
page.makeValueBinding(knobs[48].mSurfaceValue, page_focus.mChannelEQ.mBand1.mQ).setSubPage(subPageGain)
page.makeValueBinding(knobs[49].mSurfaceValue, page_focus.mChannelEQ.mBand2.mQ).setSubPage(subPageGain)
page.makeValueBinding(knobs[50].mSurfaceValue, page_focus.mChannelEQ.mBand3.mQ).setSubPage(subPageGain)
page.makeValueBinding(knobs[51].mSurfaceValue, page_focus.mChannelEQ.mBand4.mQ).setSubPage(subPageGain)
page.makeValueBinding(buttons[40].mSurfaceValue, page_focus.mChannelEQ.mBand1.mOn).setTypeToggle()
page.makeValueBinding(buttons[41].mSurfaceValue, page_focus.mChannelEQ.mBand2.mOn).setTypeToggle()
page.makeValueBinding(buttons[42].mSurfaceValue, page_focus.mChannelEQ.mBand3.mOn).setTypeToggle()
page.makeValueBinding(buttons[43].mSurfaceValue, page_focus.mChannelEQ.mBand4.mOn).setTypeToggle()
page.makeValueBinding(buttons[34].mSurfaceValue, page_focus.mPreFilter.mPhaseSwitch).setTypeToggle()
page.makeValueBinding(knobs[36].mSurfaceValue, page_focus.mPreFilter.mHighCutFreq)
page.makeValueBinding(knobs[44].mSurfaceValue, page_focus.mPreFilter.mLowCutFreq)
page.makeValueBinding(knobs[52].mSurfaceValue, page_focus.mPreFilter.mGain)
page.makeValueBinding(buttons[36].mSurfaceValue, page_focus.mPreFilter.mHighCutOn).setTypeToggle()
page.makeValueBinding(buttons[44].mSurfaceValue, page_focus.mPreFilter.mLowCutOn).setTypeToggle()

//other
page.makeValueBinding(knobs[37].mSurfaceValue, page.mHostAccess.mControlRoom.mMainChannel.mLevelValue)
page.makeValueBinding(knobs[38].mSurfaceValue, page.mHostAccess.mTransport.mValue.mMetronomeClickLevel)
page.makeValueBinding(knobs[39].mSurfaceValue, page_focus.mValue.mPan)
page.makeValueBinding(knobs[55].mSurfaceValue, page_focus.mValue.mVolume)
page.makeValueBinding(buttons[38].mSurfaceValue, page_focus.mValue.mMonitorEnable).setTypeToggle()
page.makeValueBinding(buttons[39].mSurfaceValue, page_focus.mValue.mSolo).setTypeToggle()
page.makeValueBinding(buttons[37].mSurfaceValue, page_focus.mValue.mAutomationRead).setTypeToggle()
page.makeValueBinding(buttons[38].mSurfaceValue, page_focus.mValue.mRecordEnable).setTypeToggle()
page.makeValueBinding(buttons[45].mSurfaceValue, page_focus.mValue.mAutomationWrite).setTypeToggle()
page.makeValueBinding(buttons[46].mSurfaceValue, page_focus.mValue.mMonitorEnable).setTypeToggle()
page.makeValueBinding(buttons[47].mSurfaceValue, page_focus.mValue.mMute).setTypeToggle()
page.makeValueBinding(knobs[54].mSurfaceValue, page.mHostAccess.mMouseCursor.mValueUnderMouse)
page.makeValueBinding(buttons[48].mSurfaceValue, page_focus.mValue.mEditorOpen).setTypeToggle()
page.makeValueBinding(buttons[33].mSurfaceValue, page_focus.mValue.mInstrumentOpen).setTypeToggle()
page.makeActionBinding(buttons[49].mSurfaceValue, page.mHostAccess.mTrackSelection.mAction.mPrevTrack)
page.makeActionBinding(buttons[51].mSurfaceValue, page.mHostAccess.mTrackSelection.mAction.mNextTrack)

//-----------
//Mixing page
//-----------
var mixPage = deviceDriver.mMapping.makePage('Mixing')
mixPage.setLabelFieldText(pagename, 'Mixing')
mixPage.setLabelFieldHostObject(selTrackName, mixPage.mHostAccess.mTrackSelection.mMixerChannel)

var hostMixerBankZone = mixPage.mHostAccess.mMixConsole.makeMixerBankZone()
.excludeInputChannels()
.excludeOutputChannels()

for (var i = 0; i < 8; ++i) {
    var channelBankItem = hostMixerBankZone.makeMixerBankChannel()
    mixPage.makeValueBinding(knobs[i+48].mSurfaceValue, channelBankItem.mValue.mVolume)
    mixPage.makeValueBinding(knobs[i+32].mSurfaceValue, channelBankItem.mValue.mPan)
    //mixPage.makeValueBinding(buttons[i+32].mSurfaceValue, channelBankItem.mValue.mSolo).setTypeToggle()
	mixPage.makeValueBinding(buttons[i+40].mSurfaceValue, channelBankItem.mValue.mMute).setTypeToggle()
    mixPage.makeValueBinding(buttons[i+32].mSurfaceValue, channelBankItem.mValue.mSelected)
    mixPage.setLabelFieldHostObject(trackNames[i], channelBankItem.mValue)
}

for(var e = 0; e < 8; ++e) {
	var knob1 = knobs[e]
	var button1 = buttons[e]
    var knob2 = knobs[e + 8]
	var button2 = buttons[e + 8]
	var knob3 = knobs[e + 16]
	var knob4 = knobs[e + 24]
	var button4 = buttons[e + 24]
	
	var sendSlot = mixPage.mHostAccess.mTrackSelection.mMixerChannel.mSends.getByIndex(e)
    var focusQuickControl = mixPage.mHostAccess.mFocusedQuickControls.getByIndex(e)
	var trackQuickControl = mixPage.mHostAccess.mTrackSelection.mMixerChannel.mQuickControls.getByIndex(e)
    var cueSend = mixPage.mHostAccess.mTrackSelection.mMixerChannel.mCueSends.getByIndex(e)
	
	mixPage.makeValueBinding(knob1.mSurfaceValue, sendSlot.mLevel)
	mixPage.makeValueBinding(button1.mSurfaceValue, sendSlot.mOn).setTypeToggle()
    mixPage.makeValueBinding(knob2.mSurfaceValue, focusQuickControl)
	mixPage.makeValueBinding(button2.mSurfaceValue, focusQuickControl).setTypeToggle()
	mixPage.makeValueBinding(knob3.mSurfaceValue, trackQuickControl)
	mixPage.makeValueBinding(knob4.mSurfaceValue, cueSend.mLevel)
	mixPage.makeValueBinding(button4.mSurfaceValue, cueSend.mOn).setTypeToggle()
}

//next track
/*
mixPage.makeActionBinding(buttons[49].mSurfaceValue, mixPage.mHostAccess.mTrackSelection.mAction.mPrevTrack)
mixPage.makeActionBinding(buttons[51].mSurfaceValue, mixPage.mHostAccess.mTrackSelection.mAction.mNextTrack)
*/
mixPage.makeValueBinding(buttons[48].mSurfaceValue, mixPage.mHostAccess.mTrackSelection.mMixerChannel.mValue.mEditorOpen).setTypeToggle()
mixPage.makeActionBinding(buttons[49].mSurfaceValue, hostMixerBankZone.mAction.mPrevBank)
mixPage.makeActionBinding(buttons[51].mSurfaceValue, hostMixerBankZone.mAction.mNextBank)

//page select
mixPage.makeActionBinding(buttons[50].mSurfaceValue, page.mAction.mActivate)
page.makeActionBinding(buttons[50].mSurfaceValue, mixPage.mAction.mActivate)
