// Behringer BCF2000 v 1.0 by Giampaolo Gesuale

//-----------------------------------------------------------------------------
// 1. DRIVER SETUP - create driver object, midi ports and detection information
//-----------------------------------------------------------------------------

var midiremote_api = require('midiremote_api_v1')
var deviceDriver = midiremote_api.makeDeviceDriver('behringer', 'bcf2000', 'Giampaolo Gesuale')

var midiInput = deviceDriver.mPorts.makeMidiInput()
var midiOutput = deviceDriver.mPorts.makeMidiOutput()

deviceDriver.makeDetectionUnit().detectPortPair(midiInput, midiOutput)
    .expectInputNameEquals('BCF2000')
    .expectOutputNameEquals('BCF2000')

deviceDriver.makeDetectionUnit().detectPortPair(midiInput, midiOutput)
    .expectInputNameContains('BCF2000')
    .expectOutputNameContains('BCF2000')

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
var faders = []

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

//faders
var nFaders = 8
for(var rk = 0; rk < nFaders/inarow; ++rk) {
    for (var ck=0; ck<inarow; ++ck){
        var fader = surface.makeFader(ck*2, rk*3+6, 2, 9)
        fader.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput).setOutputPort(midiOutput)
        .bindToControlChange(0, 81+ck+rk*inarow).setTypeAbsolute()
        faders.push(fader)
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
    mixPage.makeValueBinding(faders[i].mSurfaceValue, channelBankItem.mValue.mVolume)
    mixPage.makeValueBinding(knobs[i].mSurfaceValue, channelBankItem.mValue.mPan)
    mixPage.makeValueBinding(buttons[i+32].mSurfaceValue, channelBankItem.mValue.mSolo).setTypeToggle()
	mixPage.makeValueBinding(buttons[i+40].mSurfaceValue, channelBankItem.mValue.mMute).setTypeToggle()
    mixPage.makeValueBinding(buttons[i].mSurfaceValue, channelBankItem.mValue.mSelected)
    mixPage.setLabelFieldHostObject(trackNames[i], channelBankItem.mValue)
}

for(var e = 0; e < 8; ++e) {
	var button1 = buttons[e]
    var knob2 = knobs[e + 8]
	var button2 = buttons[e + 8]
	var knob3 = knobs[e + 16]
    var button3 = buttons[e + 16]
	var knob4 = knobs[e + 24]
	var button4 = buttons[e + 24]
	
    var sendSlot = mixPage.mHostAccess.mTrackSelection.mMixerChannel.mSends.getByIndex(e)
    var focusQuickControl = mixPage.mHostAccess.mFocusedQuickControls.getByIndex(e)
	var cueSend = mixPage.mHostAccess.mTrackSelection.mMixerChannel.mCueSends.getByIndex(e)
	
    mixPage.makeValueBinding(knob2.mSurfaceValue, sendSlot.mLevel)
	mixPage.makeValueBinding(button2.mSurfaceValue, sendSlot.mOn).setTypeToggle()
    mixPage.makeValueBinding(knob3.mSurfaceValue, focusQuickControl)
	mixPage.makeValueBinding(button3.mSurfaceValue, focusQuickControl).setTypeToggle()
	mixPage.makeValueBinding(knob4.mSurfaceValue, cueSend.mLevel)
	mixPage.makeValueBinding(button4.mSurfaceValue, cueSend.mOn).setTypeToggle()
}

mixPage.makeValueBinding(buttons[48].mSurfaceValue, mixPage.mHostAccess.mTrackSelection.mMixerChannel.mValue.mEditorOpen).setTypeToggle()
mixPage.makeActionBinding(buttons[49].mSurfaceValue, hostMixerBankZone.mAction.mPrevBank)
mixPage.makeActionBinding(buttons[51].mSurfaceValue, hostMixerBankZone.mAction.mNextBank)
