//Behringer BCR2000 v 1.5 by Giampaolo Gesuale

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
//midiOutput.sendSysexFile( , 'preset.bcr', 5)

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

//send level
page.makeValueBinding(knobs[0].mSurfaceValue, page_mix.mSends.getByIndex(0).mLevel)
page.makeValueBinding(knobs[1].mSurfaceValue, page_mix.mSends.getByIndex(1).mLevel)
page.makeValueBinding(knobs[2].mSurfaceValue, page_mix.mSends.getByIndex(2).mLevel)
page.makeValueBinding(knobs[3].mSurfaceValue, page_mix.mSends.getByIndex(3).mLevel)
page.makeValueBinding(knobs[4].mSurfaceValue, page_mix.mSends.getByIndex(4).mLevel)
page.makeValueBinding(knobs[5].mSurfaceValue, page_mix.mSends.getByIndex(5).mLevel)
page.makeValueBinding(knobs[6].mSurfaceValue, page_mix.mSends.getByIndex(6).mLevel)
page.makeValueBinding(knobs[7].mSurfaceValue, page_mix.mSends.getByIndex(7).mLevel)

//send on/off
page.makeValueBinding(buttons[0].mSurfaceValue, page_mix.mSends.getByIndex(0).mOn).setTypeToggle()
page.makeValueBinding(buttons[1].mSurfaceValue, page_mix.mSends.getByIndex(1).mOn).setTypeToggle()
page.makeValueBinding(buttons[2].mSurfaceValue, page_mix.mSends.getByIndex(2).mOn).setTypeToggle()
page.makeValueBinding(buttons[3].mSurfaceValue, page_mix.mSends.getByIndex(3).mOn).setTypeToggle()
page.makeValueBinding(buttons[4].mSurfaceValue, page_mix.mSends.getByIndex(4).mOn).setTypeToggle()
page.makeValueBinding(buttons[5].mSurfaceValue, page_mix.mSends.getByIndex(5).mOn).setTypeToggle()
page.makeValueBinding(buttons[6].mSurfaceValue, page_mix.mSends.getByIndex(6).mOn).setTypeToggle()
page.makeValueBinding(buttons[7].mSurfaceValue, page_mix.mSends.getByIndex(7).mOn).setTypeToggle()

// Focused quick controls
page.makeValueBinding(knobs[8].mSurfaceValue, page.mHostAccess.mFocusedQuickControls.getByIndex(0))
page.makeValueBinding(knobs[9].mSurfaceValue, page.mHostAccess.mFocusedQuickControls.getByIndex(1))
page.makeValueBinding(knobs[10].mSurfaceValue, page.mHostAccess.mFocusedQuickControls.getByIndex(2))
page.makeValueBinding(knobs[11].mSurfaceValue, page.mHostAccess.mFocusedQuickControls.getByIndex(3))
page.makeValueBinding(knobs[12].mSurfaceValue, page.mHostAccess.mFocusedQuickControls.getByIndex(4))
page.makeValueBinding(knobs[13].mSurfaceValue, page.mHostAccess.mFocusedQuickControls.getByIndex(5))
page.makeValueBinding(knobs[14].mSurfaceValue, page.mHostAccess.mFocusedQuickControls.getByIndex(6))
page.makeValueBinding(knobs[15].mSurfaceValue, page.mHostAccess.mFocusedQuickControls.getByIndex(7))

page.makeValueBinding(buttons[8].mSurfaceValue, page.mHostAccess.mFocusedQuickControls.getByIndex(0)).setTypeToggle()
page.makeValueBinding(buttons[9].mSurfaceValue, page.mHostAccess.mFocusedQuickControls.getByIndex(1)).setTypeToggle()
page.makeValueBinding(buttons[10].mSurfaceValue, page.mHostAccess.mFocusedQuickControls.getByIndex(2)).setTypeToggle()
page.makeValueBinding(buttons[11].mSurfaceValue, page.mHostAccess.mFocusedQuickControls.getByIndex(3)).setTypeToggle()
page.makeValueBinding(buttons[12].mSurfaceValue, page.mHostAccess.mFocusedQuickControls.getByIndex(4)).setTypeToggle()
page.makeValueBinding(buttons[13].mSurfaceValue, page.mHostAccess.mFocusedQuickControls.getByIndex(5)).setTypeToggle()
page.makeValueBinding(buttons[14].mSurfaceValue, page.mHostAccess.mFocusedQuickControls.getByIndex(6)).setTypeToggle()
page.makeValueBinding(buttons[15].mSurfaceValue, page.mHostAccess.mFocusedQuickControls.getByIndex(7)).setTypeToggle()

page.makeValueBinding(buttons[32].mSurfaceValue, page.mHostAccess.mFocusedQuickControls.mFocusLockedValue).setTypeToggle()

// Track quick controls 
page.makeValueBinding(knobs[16].mSurfaceValue, page_mix.mQuickControls.getByIndex(0))
page.makeValueBinding(knobs[17].mSurfaceValue, page_mix.mQuickControls.getByIndex(1))
page.makeValueBinding(knobs[18].mSurfaceValue, page_mix.mQuickControls.getByIndex(2))
page.makeValueBinding(knobs[19].mSurfaceValue, page_mix.mQuickControls.getByIndex(3))
page.makeValueBinding(knobs[20].mSurfaceValue, page_mix.mQuickControls.getByIndex(4))
page.makeValueBinding(knobs[21].mSurfaceValue, page_mix.mQuickControls.getByIndex(5))
page.makeValueBinding(knobs[22].mSurfaceValue, page_mix.mQuickControls.getByIndex(6))
page.makeValueBinding(knobs[23].mSurfaceValue, page_mix.mQuickControls.getByIndex(7))

//cue
page.makeValueBinding(knobs[24].mSurfaceValue, page_mix.mCueSends.getByIndex(0).mLevel)
page.makeValueBinding(knobs[25].mSurfaceValue, page_mix.mCueSends.getByIndex(1).mLevel)
page.makeValueBinding(knobs[26].mSurfaceValue, page_mix.mCueSends.getByIndex(2).mLevel)
page.makeValueBinding(knobs[27].mSurfaceValue, page_mix.mCueSends.getByIndex(3).mLevel)
page.makeValueBinding(knobs[28].mSurfaceValue, page_mix.mCueSends.getByIndex(4).mLevel)
page.makeValueBinding(knobs[29].mSurfaceValue, page_mix.mCueSends.getByIndex(5).mLevel)
page.makeValueBinding(knobs[30].mSurfaceValue, page_mix.mCueSends.getByIndex(6).mLevel)
page.makeValueBinding(knobs[31].mSurfaceValue, page_mix.mCueSends.getByIndex(7).mLevel)

page.makeValueBinding(buttons[24].mSurfaceValue, page_mix.mCueSends.getByIndex(0).mOn).setTypeToggle()
page.makeValueBinding(buttons[25].mSurfaceValue, page_mix.mCueSends.getByIndex(1).mOn).setTypeToggle()
page.makeValueBinding(buttons[26].mSurfaceValue, page_mix.mCueSends.getByIndex(2).mOn).setTypeToggle()
page.makeValueBinding(buttons[27].mSurfaceValue, page_mix.mCueSends.getByIndex(3).mOn).setTypeToggle()
page.makeValueBinding(buttons[28].mSurfaceValue, page_mix.mCueSends.getByIndex(4).mOn).setTypeToggle()
page.makeValueBinding(buttons[29].mSurfaceValue, page_mix.mCueSends.getByIndex(5).mOn).setTypeToggle()
page.makeValueBinding(buttons[30].mSurfaceValue, page_mix.mCueSends.getByIndex(6).mOn).setTypeToggle()
page.makeValueBinding(buttons[31].mSurfaceValue, page_mix.mCueSends.getByIndex(7).mOn).setTypeToggle()

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