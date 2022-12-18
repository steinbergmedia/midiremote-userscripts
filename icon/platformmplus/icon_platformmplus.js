// Icon Platform M+ midi Remote
// Robert Woodcock
//
// Portions of this implementation where inspired by other midi remote creates to whom I wish to say thank you!
// - Mackie C4 by Ron Garrison <ron.garrison@gmail.com> https://github.com/rwgarrison/midiremote-userscripts

var iconElements = require('./icon_elements.js')
var makeChannelControl = iconElements.makeChannelControl
var makeMasterControl = iconElements.makeMasterControl
var makeTransport = iconElements.makeTransport
var clearAllLeds = iconElements.clearAllLeds
var Helper_updateDisplay = iconElements.Helper_updateDisplay

//-----------------------------------------------------------------------------
// 1. DRIVER SETUP - create driver object, midi ports and detection information
//-----------------------------------------------------------------------------

// get the api's entry point
var midiremote_api = require('midiremote_api_v1')

// create the device driver main object
var deviceDriver = midiremote_api.makeDeviceDriver('Icon', 'Platform Mplus', 'Big Fat Wombat')

// create objects representing the hardware's MIDI ports
var midiInput = deviceDriver.mPorts.makeMidiInput()
var midiOutput = deviceDriver.mPorts.makeMidiOutput()

deviceDriver.mOnActivate = function (activeDevice) {
    console.log('Icon Platform M+ Activated');
    clearAllLeds(activeDevice, midiOutput)
}

// define all possible namings the devices MIDI ports could have
// NOTE: Windows and MacOS handle port naming differently
// deviceDriver.makeDetectionUnit().detectPortPair(midiInput, midiOutput)
//     .expectInputNameEquals('Platform M+ V2.15') // Platform M+ v2.15
//     .expectOutputNameEquals('Platform M+ V2.15') // Platform M+ v2.15
deviceDriver.makeDetectionUnit().detectPortPair(midiInput, midiOutput)
    .expectInputNameContains('Platform M+')
    .expectOutputNameContains('Platform M+')

var surface = deviceDriver.mSurface

//-----------------------------------------------------------------------------
// 2. SURFACE LAYOUT - create control elements and midi bindings
//-----------------------------------------------------------------------------
function makeSurfaceElements() {
    var surfaceElements = {}

    // Display - 2lines
    surfaceElements.d2Display = surface.makeBlindPanel(0, 0, 56, 6)

    surfaceElements.numStrips = 8

    surfaceElements.channelControls = {}

    var xKnobStrip = 0
    var yKnobStrip = 5

    for (var i = 0; i < surfaceElements.numStrips; ++i) {
        surfaceElements.channelControls[i] = makeChannelControl(surface, midiInput, midiOutput, xKnobStrip, yKnobStrip, i, surfaceElements)
    }

    surfaceElements.faderMaster = makeMasterControl(surface, midiInput, midiOutput, xKnobStrip + 1, yKnobStrip + 4, surfaceElements.numStrips, surfaceElements)
    surfaceElements.transport = makeTransport(surface, midiInput, midiOutput, xKnobStrip + 63, yKnobStrip + 4, surfaceElements)

    // Track the selected track name
    surfaceElements.selectedTrack = surface.makeCustomValueVariable('selectedTrack');
    surfaceElements.selectedTrack.mOnTitleChange = function(activeDevice, objectTitle, valueTitle) {
        console.log('selectedTrack title change:'+objectTitle)
        activeDevice.setState('selectedTrackName', objectTitle)
    }

    return surfaceElements
}

var surfaceElements = makeSurfaceElements()


//-----------------------------------------------------------------------------
// 3. HOST MAPPING - create mapping mixerPages and host bindings
//-----------------------------------------------------------------------------

// Helper functions
function makeSubPage(subPageArea, name) {
    var subPage = subPageArea.makeSubPage(name)
    var msgText = 'sub page ' + name + ' activated'
    subPage.mOnActivate = (function (activeDevice) {
        console.log(msgText)
        activeDevice.setState("activeSubPage", name)
        var data = [0xf0, 0x00, 0x00, 0x66, 0x14, 0x12,
        ]
        switch (name) {
            case "Scrub":
                activeDevice.setState("indicator2", "S")
                break;
            case "Nudge":
                activeDevice.setState("indicator2", "N")
                break;
            case "Nav":
                activeDevice.setState("indicator1", "N")
                break;
            case "Zoom":
                activeDevice.setState("indicator1", "Z")
                break;
        }
        Helper_updateDisplay('Row1', 'Row2', 'AltRow1', 'AltRow2', activeDevice, midiOutput)
    }).bind({ subPage, name })
    return subPage
}
/**
 * @param {string} name
*/
// Mappings for the default areas - transport, zoom, knob
function makePageWithDefaults(name) {
    var page = deviceDriver.mMapping.makePage(name)
    var jogSubPageArea = page.makeSubPageArea('Jog')
    var zoomSubPageArea = page.makeSubPageArea('Zoom')
    var subPageJogNudge = makeSubPage(jogSubPageArea, 'Nudge')
    var subPageJogScrub = makeSubPage(jogSubPageArea, 'Scrub')
    var subPageJogZoom = makeSubPage(zoomSubPageArea, 'Zoom')
    var subPageJobNav = makeSubPage(zoomSubPageArea, 'Nav')

    // Transport controls
    page.makeActionBinding(surfaceElements.transport.prevChn.mSurfaceValue, deviceDriver.mAction.mPrevPage)
    page.makeActionBinding(surfaceElements.transport.nextChn.mSurfaceValue, deviceDriver.mAction.mNextPage)
    page.makeCommandBinding(surfaceElements.transport.prevBnk.mSurfaceValue, 'Transport', 'Locate Previous Marker')
    page.makeCommandBinding(surfaceElements.transport.nextBnk.mSurfaceValue, 'Transport', 'Locate Next Marker')
    page.makeValueBinding(surfaceElements.transport.btnForward.mSurfaceValue, page.mHostAccess.mTransport.mValue.mForward)
    page.makeValueBinding(surfaceElements.transport.btnRewind.mSurfaceValue, page.mHostAccess.mTransport.mValue.mRewind)
    page.makeValueBinding(surfaceElements.transport.btnStart.mSurfaceValue, page.mHostAccess.mTransport.mValue.mStart).setTypeToggle()
    page.makeValueBinding(surfaceElements.transport.btnStop.mSurfaceValue, page.mHostAccess.mTransport.mValue.mStop).setTypeToggle()
    page.makeValueBinding(surfaceElements.transport.btnRecord.mSurfaceValue, page.mHostAccess.mTransport.mValue.mRecord).setTypeToggle()
    page.makeValueBinding(surfaceElements.transport.btnCycle.mSurfaceValue, page.mHostAccess.mTransport.mValue.mCycleActive).setTypeToggle()

    // Zoom Pages - when either Zoom light is on
    page.makeCommandBinding(surfaceElements.transport.zoomVertIn.mSurfaceValue, 'Zoom', 'Zoom In Vertically').setSubPage(subPageJogZoom)
    page.makeCommandBinding(surfaceElements.transport.zoomVertOut.mSurfaceValue, 'Zoom', 'Zoom Out Vertically').setSubPage(subPageJogZoom)
    page.makeCommandBinding(surfaceElements.transport.zoomHorizIn.mSurfaceValue, 'Zoom', 'Zoom In').setSubPage(subPageJogZoom)
    page.makeCommandBinding(surfaceElements.transport.zoomHorizOut.mSurfaceValue, 'Zoom', 'Zoom Out').setSubPage(subPageJogZoom)
    // Nav Pages
    page.makeActionBinding(surfaceElements.transport.zoomVertIn.mSurfaceValue, page.mHostAccess.mTrackSelection.mAction.mNextTrack).setSubPage(subPageJobNav)
    page.makeActionBinding(surfaceElements.transport.zoomVertOut.mSurfaceValue, page.mHostAccess.mTrackSelection.mAction.mPrevTrack).setSubPage(subPageJobNav)
    page.makeCommandBinding(surfaceElements.transport.zoomHorizIn.mSurfaceValue, 'Transport', 'Locate Next Event').setSubPage(subPageJobNav)
    page.makeCommandBinding(surfaceElements.transport.zoomHorizOut.mSurfaceValue, 'Transport', 'Locate Previous Event').setSubPage(subPageJobNav)
    // Switch Zoom and Nav via simultaneous press of Zoom buttons
    page.makeActionBinding(surfaceElements.transport.btnZoomOnOff.mSurfaceValue, zoomSubPageArea.mAction.mNext)
    // page.makeActionBinding(surfaceElements.transport.zoomState.mSurfaceValue, zoomSubPageArea.mAction.mNext)

    // Jog Pages - when Zoom lights are off
    // Nudge
    page.makeCommandBinding(surfaceElements.transport.jogLeftVariable, 'Transport', 'Nudge Cursor Left').setSubPage(subPageJogNudge)
    page.makeCommandBinding(surfaceElements.transport.jogRightVariable, 'Transport', 'Nudge Cursor Right').setSubPage(subPageJogNudge)
    // Scrub (Jog in Cubase)
    page.makeCommandBinding(surfaceElements.transport.jogLeftVariable, 'Transport', 'Jog Left').setSubPage(subPageJogScrub)
    page.makeCommandBinding(surfaceElements.transport.jogRightVariable, 'Transport', 'Jog Right').setSubPage(subPageJogScrub)
    // Switch between Nudge and Scrub by tapping knob
    page.makeActionBinding(surfaceElements.transport.jog_wheel.mPushValue, jogSubPageArea.mAction.mNext)

    var MasterFaderSubPageArea = page.makeSubPageArea('MasterFader')
    var subPageMasterFaderValue = makeSubPage(MasterFaderSubPageArea, 'MF_ValueUnderCursor')

    page.makeValueBinding(surfaceElements.faderMaster.fader.mSurfaceValue, page.mHostAccess.mMouseCursor.mValueUnderMouse).setValueTakeOverModeJump().setSubPage(subPageMasterFaderValue)

    // Automation for selected tracks
    var selectedTrackChannel = page.mHostAccess.mTrackSelection.mMixerChannel

    // Automation for selected tracks
    page.makeValueBinding(surfaceElements.faderMaster.read_button.mSurfaceValue, selectedTrackChannel.mValue.mAutomationRead).setTypeToggle()
    page.makeValueBinding(surfaceElements.faderMaster.write_button.mSurfaceValue, selectedTrackChannel.mValue.mAutomationWrite).setTypeToggle()

    return page
}

function makePageMixer() {
    var page = makePageWithDefaults('Mixer')

    var FaderSubPageArea = page.makeSubPageArea('FadersKnobs')
    var subPageFaderVolume = makeSubPage(FaderSubPageArea, 'Volume')

    var ButtonSubPageArea = page.makeSubPageArea('Buttons')
    var subPageButtonDefaultSet = makeSubPage(ButtonSubPageArea, 'DefaultSet')

    var hostMixerBankZone = page.mHostAccess.mMixConsole.makeMixerBankZone("AudioInstrBanks")
        .includeAudioChannels()
        .includeInstrumentChannels()
        .setFollowVisibility(true)

    for (var channelIndex = 0; channelIndex < surfaceElements.numStrips; ++channelIndex) {
        var hostMixerBankChannel = hostMixerBankZone.makeMixerBankChannel()

        var knobSurfaceValue = surfaceElements.channelControls[channelIndex].pushEncoder.mEncoderValue;
        var knobPushValue = surfaceElements.channelControls[channelIndex].pushEncoder.mPushValue;
        var faderSurfaceValue = surfaceElements.channelControls[channelIndex].fader.mSurfaceValue;
        var faderTouchSurfaceValue = surfaceElements.channelControls[channelIndex].fader_touch.mSurfaceValue;
        var sel_buttonSurfaceValue = surfaceElements.channelControls[channelIndex].sel_button.mSurfaceValue;
        var mute_buttonSurfaceValue = surfaceElements.channelControls[channelIndex].mute_button.mSurfaceValue;
        var solo_buttonSurfaceValue = surfaceElements.channelControls[channelIndex].solo_button.mSurfaceValue;
        var rec_buttonSurfaceValue = surfaceElements.channelControls[channelIndex].rec_button.mSurfaceValue;

        // FaderKnobs - Volume, Pan, Editor Open
        page.makeValueBinding(knobSurfaceValue, hostMixerBankChannel.mValue.mPan).setSubPage(subPageFaderVolume)
        page.makeValueBinding(knobPushValue, hostMixerBankChannel.mValue.mEditorOpen).setTypeToggle().setSubPage(subPageFaderVolume)
        page.makeValueBinding(faderSurfaceValue, hostMixerBankChannel.mValue.mVolume).setValueTakeOverModeJump().setSubPage(subPageFaderVolume)
        page.makeValueBinding(sel_buttonSurfaceValue, hostMixerBankChannel.mValue.mSelected).setTypeToggle().setSubPage(subPageButtonDefaultSet)
        page.makeValueBinding(mute_buttonSurfaceValue, hostMixerBankChannel.mValue.mMute).setTypeToggle().setSubPage(subPageButtonDefaultSet)
        page.makeValueBinding(solo_buttonSurfaceValue, hostMixerBankChannel.mValue.mSolo).setTypeToggle().setSubPage(subPageButtonDefaultSet)
        page.makeValueBinding(rec_buttonSurfaceValue, hostMixerBankChannel.mValue.mRecordEnable).setTypeToggle().setSubPage(subPageButtonDefaultSet)
    }

    return page
}

function makePageSelectedTrack() {
    var page = makePageWithDefaults('Selected Channel')

    var faderSubPageArea = page.makeSubPageArea('Faders')
    var subPageSendsQC = makeSubPage(faderSubPageArea, 'SendsQC')
    var subPageEQ = makeSubPage(faderSubPageArea, 'EQ')
    var subPageCueSends = makeSubPage(faderSubPageArea, 'CueSends')
    var subPagePreFilter = makeSubPage(faderSubPageArea, 'PreFilter')

    var selectedTrackChannel = page.mHostAccess.mTrackSelection.mMixerChannel

    // Custom variable for track the selectedTrack so we can get to it's name
    page.makeValueBinding(surfaceElements.selectedTrack, selectedTrackChannel.mValue.mVolume)
    /// SendsQC subPage
    // Sends on PushEncodes and mute button for pre/post
    // Focus QC on Faders
    // Fader
    for (var idx = 0; idx < surfaceElements.numStrips; ++idx) {
        var knobSurfaceValue = surfaceElements.channelControls[idx].pushEncoder.mEncoderValue;
        var knobPushValue = surfaceElements.channelControls[idx].pushEncoder.mPushValue;
        var faderSurfaceValue = surfaceElements.channelControls[idx].fader.mSurfaceValue;

        page.makeValueBinding(knobSurfaceValue, selectedTrackChannel.mSends.getByIndex(idx).mLevel).setSubPage(subPageSendsQC)
        page.makeValueBinding(knobPushValue, selectedTrackChannel.mSends.getByIndex(idx).mOn).setTypeToggle().setSubPage(subPageSendsQC)
        page.makeValueBinding(faderSurfaceValue, page.mHostAccess.mFocusedQuickControls.getByIndex(idx)).setValueTakeOverModeJump().setSubPage(subPageSendsQC)

        page.makeValueBinding(surfaceElements.channelControls[idx].sel_button.mSurfaceValue, selectedTrackChannel.mSends.getByIndex(idx).mOn).setTypeToggle().setSubPage(subPageSendsQC)
        page.makeValueBinding(surfaceElements.channelControls[idx].mute_button.mSurfaceValue, selectedTrackChannel.mSends.getByIndex(idx).mPrePost).setTypeToggle().setSubPage(subPageSendsQC)
    }

    // Handy controls for easy access
    page.makeCommandBinding(surfaceElements.channelControls[4].solo_button.mSurfaceValue, 'Automation', 'Show Used Automation (Selected Tracks)').setSubPage(subPageSendsQC)
    page.makeCommandBinding(surfaceElements.channelControls[5].solo_button.mSurfaceValue, 'Automation', 'Hide Automation').setSubPage(subPageSendsQC)
    page.makeValueBinding(surfaceElements.channelControls[6].solo_button.mSurfaceValue, selectedTrackChannel.mValue.mEditorOpen).setTypeToggle().setSubPage(subPageSendsQC)
    page.makeValueBinding(surfaceElements.channelControls[7].solo_button.mSurfaceValue, selectedTrackChannel.mValue.mInstrumentOpen).setTypeToggle().setSubPage(subPageSendsQC)

    page.makeValueBinding(surfaceElements.channelControls[4].rec_button.mSurfaceValue, selectedTrackChannel.mValue.mMonitorEnable).setTypeToggle().setSubPage(subPageSendsQC)
    page.makeValueBinding(surfaceElements.channelControls[5].rec_button.mSurfaceValue, selectedTrackChannel.mValue.mMute).setTypeToggle().setSubPage(subPageSendsQC)
    page.makeValueBinding(surfaceElements.channelControls[6].rec_button.mSurfaceValue, selectedTrackChannel.mValue.mSolo).setTypeToggle().setSubPage(subPageSendsQC)
    page.makeValueBinding(surfaceElements.channelControls[7].rec_button.mSurfaceValue, selectedTrackChannel.mValue.mRecordEnable).setTypeToggle().setSubPage(subPageSendsQC)

    // EQ Related but on Sends page so you know EQ activated...not sure the best option but hey, more buttons and lights is cool!
    page.makeValueBinding(surfaceElements.channelControls[0].solo_button.mSurfaceValue, selectedTrackChannel.mChannelEQ.mBand1.mOn).setTypeToggle().setSubPage(subPageSendsQC)
    page.makeValueBinding(surfaceElements.channelControls[1].solo_button.mSurfaceValue, selectedTrackChannel.mChannelEQ.mBand2.mOn).setTypeToggle().setSubPage(subPageSendsQC)
    page.makeValueBinding(surfaceElements.channelControls[2].solo_button.mSurfaceValue, selectedTrackChannel.mChannelEQ.mBand3.mOn).setTypeToggle().setSubPage(subPageSendsQC)
    page.makeValueBinding(surfaceElements.channelControls[3].solo_button.mSurfaceValue, selectedTrackChannel.mChannelEQ.mBand4.mOn).setTypeToggle().setSubPage(subPageSendsQC)

    page.makeActionBinding(surfaceElements.channelControls[0].rec_button.mSurfaceValue, subPageSendsQC.mAction.mActivate).setSubPage(subPageSendsQC)
    page.makeActionBinding(surfaceElements.channelControls[1].rec_button.mSurfaceValue, subPageEQ.mAction.mActivate).setSubPage(subPageSendsQC)
    page.makeActionBinding(surfaceElements.channelControls[2].rec_button.mSurfaceValue, subPagePreFilter.mAction.mActivate).setSubPage(subPageSendsQC)
    page.makeActionBinding(surfaceElements.channelControls[3].rec_button.mSurfaceValue, subPageCueSends.mAction.mActivate).setSubPage(subPageSendsQC)

    // WIP Add Subpage Displays to Selected channel
    // EQ Subpage
    const eqBand = []
    eqBand[0] = selectedTrackChannel.mChannelEQ.mBand1
    eqBand[1] = selectedTrackChannel.mChannelEQ.mBand2
    eqBand[2] = selectedTrackChannel.mChannelEQ.mBand3
    eqBand[3] = selectedTrackChannel.mChannelEQ.mBand4
    for (var idx = 0; idx < 4; ++idx) {
        var knobSurfaceValue = surfaceElements.channelControls[idx].pushEncoder.mEncoderValue;
        var knob2SurfaceValue = surfaceElements.channelControls[idx + 4].pushEncoder.mEncoderValue;
        var knobPushValue = surfaceElements.channelControls[idx].pushEncoder.mPushValue;
        var knob2PushValue = surfaceElements.channelControls[idx + 4].pushEncoder.mPushValue;
        var faderSurfaceValue = surfaceElements.channelControls[idx].fader.mSurfaceValue;
        var fader2SurfaceValue = surfaceElements.channelControls[idx + 4].fader.mSurfaceValue;

        page.makeValueBinding(knobSurfaceValue, eqBand[idx].mFilterType).setSubPage(subPageEQ)
        page.makeValueBinding(knob2SurfaceValue, eqBand[idx].mQ).setSubPage(subPageEQ)
        page.makeValueBinding(knobPushValue, eqBand[idx].mOn).setTypeToggle().setSubPage(subPageEQ)
        page.makeValueBinding(knob2PushValue, eqBand[idx].mOn).setTypeToggle().setSubPage(subPageEQ)
        page.makeValueBinding(faderSurfaceValue, eqBand[idx].mGain).setSubPage(subPageEQ)
        page.makeValueBinding(fader2SurfaceValue, eqBand[idx].mFreq).setSubPage(subPageEQ)
    }

    /// CueSends subPage
    for (var idx = 0; idx < selectedTrackChannel.mCueSends.getSize(); ++idx) {
        var knobSurfaceValue = surfaceElements.channelControls[idx].pushEncoder.mEncoderValue;
        var knobPushValue = surfaceElements.channelControls[idx].pushEncoder.mPushValue;
        var faderSurfaceValue = surfaceElements.channelControls[idx].fader.mSurfaceValue;

        page.makeValueBinding(knobSurfaceValue, selectedTrackChannel.mCueSends.getByIndex(idx).mPan).setSubPage(subPageCueSends)
        page.makeValueBinding(knobPushValue, selectedTrackChannel.mCueSends.getByIndex(idx).mOn).setTypeToggle().setSubPage(subPageCueSends)
        page.makeValueBinding(faderSurfaceValue, selectedTrackChannel.mCueSends.getByIndex(idx).mLevel).setSubPage(subPageCueSends)

        page.makeValueBinding(surfaceElements.channelControls[idx].sel_button.mSurfaceValue, selectedTrackChannel.mCueSends.getByIndex(idx).mOn).setTypeToggle().setSubPage(subPageCueSends)
        page.makeValueBinding(surfaceElements.channelControls[idx].mute_button.mSurfaceValue, selectedTrackChannel.mCueSends.getByIndex(idx).mPrePost).setTypeToggle().setSubPage(subPageCueSends)
    }

    // PreFilter subPage
    var knobSurfaceValue = surfaceElements.channelControls[0].pushEncoder.mEncoderValue;
    var knob2SurfaceValue = surfaceElements.channelControls[1].pushEncoder.mEncoderValue;
    var knob3SurfaceValue = surfaceElements.channelControls[2].pushEncoder.mEncoderValue;

    var knobPushValue = surfaceElements.channelControls[0].pushEncoder.mPushValue;
    var knob2PushValue = surfaceElements.channelControls[1].pushEncoder.mPushValue;
    var knob3PushValue = surfaceElements.channelControls[2].pushEncoder.mPushValue;

    var faderSurfaceValue = surfaceElements.channelControls[0].fader.mSurfaceValue;
    var fader2SurfaceValue = surfaceElements.channelControls[1].fader.mSurfaceValue;
    var fader3SurfaceValue = surfaceElements.channelControls[2].fader.mSurfaceValue;

    var preFilter = selectedTrackChannel.mPreFilter

    page.makeValueBinding(surfaceElements.channelControls[0].sel_button.mSurfaceValue, preFilter.mBypass).setTypeToggle().setSubPage(subPagePreFilter)
    page.makeValueBinding(surfaceElements.channelControls[0].mute_button.mSurfaceValue, preFilter.mPhaseSwitch).setTypeToggle().setSubPage(subPagePreFilter)

    page.makeValueBinding(surfaceElements.channelControls[1].sel_button.mSurfaceValue, preFilter.mHighCutOn).setTypeToggle().setSubPage(subPagePreFilter)
    page.makeValueBinding(surfaceElements.channelControls[2].sel_button.mSurfaceValue, preFilter.mLowCutOn).setTypeToggle().setSubPage(subPagePreFilter)

    page.makeValueBinding(knob2SurfaceValue, preFilter.mHighCutSlope).setSubPage(subPagePreFilter)
    page.makeValueBinding(knob3SurfaceValue, preFilter.mLowCutSlope).setSubPage(subPagePreFilter)
    page.makeValueBinding(knobPushValue, preFilter.mBypass).setTypeToggle().setSubPage(subPagePreFilter)
    page.makeValueBinding(knob2PushValue, preFilter.mHighCutOn).setTypeToggle().setSubPage(subPagePreFilter)
    page.makeValueBinding(knob3PushValue, preFilter.mLowCutOn).setTypeToggle().setSubPage(subPagePreFilter)
    page.makeValueBinding(faderSurfaceValue, preFilter.mGain).setSubPage(subPagePreFilter)
    page.makeValueBinding(fader2SurfaceValue, preFilter.mHighCutFreq).setSubPage(subPagePreFilter)
    page.makeValueBinding(fader3SurfaceValue, preFilter.mLowCutFreq).setSubPage(subPagePreFilter)

    return page
}

// function makePageChannelStrip() {
//     var page = makePageWithDefaults('Channelstrip')

//     var strip = page.makeSubPageArea('strip')
//     var gatePage = makeSubPage(strip, 'Gate')
//     var compressorPage = makeSubPage(strip, 'Compressor')
//     var toolsPage = makeSubPage(strip, 'Tools')
//     var saturatorPage = makeSubPage(strip, 'Saturator')
//     var limiterPage = makeSubPage(strip, 'Limiter')


//     var selectedTrackChannel = page.mHostAccess.mTrackSelection.mMixerChannel
//     var stripEffects = selectedTrackChannel.mInsertAndStripEffects.mStripEffects

//     for (var idx = 0; idx < surfaceElements.numStrips; ++idx) {
//         var knobSurfaceValue = surfaceElements.channelControls[idx].pushEncoder.mEncoderValue;
//         var knobPushValue = surfaceElements.channelControls[idx].pushEncoder.mPushValue;
//         var faderSurfaceValue = surfaceElements.channelControls[idx].fader.mSurfaceValue;

//         page.makeValueBinding(faderSurfaceValue, stripEffects.mGate.mParameterBankZone.makeParameterValue()).setSubPage(gatePage)
//         page.makeValueBinding(faderSurfaceValue, stripEffects.mCompressor.mParameterBankZone.makeParameterValue()).setSubPage(compressorPage)
//         page.makeValueBinding(faderSurfaceValue, stripEffects.mTools.mParameterBankZone.makeParameterValue()).setSubPage(toolsPage)
//         page.makeValueBinding(faderSurfaceValue, stripEffects.mSaturator.mParameterBankZone.makeParameterValue()).setSubPage(saturatorPage)
//         page.makeValueBinding(faderSurfaceValue, stripEffects.mLimiter.mParameterBankZone.makeParameterValue()).setSubPage(limiterPage)
//     }

//     for (var idx = 0; idx < 5; ++idx) {
//         var faderStrip = surfaceElements.channelControls[idx]
//         var type = ['mGate', 'mCompressor', 'mTools', 'mSaturator', 'mLimiter'][idx]
//         page.makeValueBinding(faderStrip.rec_button.mSurfaceValue, stripEffects[type].mOn).setTypeToggle()
//         page.makeValueBinding(faderStrip.mute_button.mSurfaceValue, stripEffects[type].mBypass).setTypeToggle()
//     }

//     page.makeActionBinding(surfaceElements.channelControls[0].sel_button.mSurfaceValue, gatePage.mAction.mActivate)
//     page.makeActionBinding(surfaceElements.channelControls[1].sel_button.mSurfaceValue, compressorPage.mAction.mActivate)
//     page.makeActionBinding(surfaceElements.channelControls[2].sel_button.mSurfaceValue, toolsPage.mAction.mActivate)
//     page.makeActionBinding(surfaceElements.channelControls[3].sel_button.mSurfaceValue, saturatorPage.mAction.mActivate)
//     page.makeActionBinding(surfaceElements.channelControls[4].sel_button.mSurfaceValue, limiterPage.mAction.mActivate)

//     gatePage.mOnActivate = function (device) { setLeds(device, 24, 'Gate') }
//     compressorPage.mOnActivate = function (device) { setLeds(device, 25, 'Compressor') }
//     toolsPage.mOnActivate = function (device) { setLeds(device, 26, 'Tools') }
//     saturatorPage.mOnActivate = function (device) { setLeds(device, 27, 'Saturator') }
//     limiterPage.mOnActivate = function (device) { setLeds(device, 28, 'Limiter') }

//     function setLeds(device, value, text) {
//         console.log('from script: Platform M+ subpage "' + text + '" activated')
//         for (var i = 0; i < 5; ++i) {
//             midiOutput.sendMidi(device, [0x90, 24 + i, 0])
//         }
//         midiOutput.sendMidi(device, [0x90, value, 127])
//     }

//     return page
// }

var mixerPage = makePageMixer()
var selectedTrackPage = makePageSelectedTrack()
// WIP Add Channel Strip Page
// var channelStripPage = makePageChannelStrip()
// WIP Add Control Room Page
// WIP Add MIDI CC Page and extra MIDI Port

// Function to clear out the Channel State for the display titles/values
// the OnDisplayChange callback is not called if the Channel doesn't have an updated
// Title. So swtiching to QC would leave the old Mixer Page "Volume" title kicking around
// in the state. By clearing state on the page activation it will update all that are changing.
function clearChannelState(/** @type {MR_ActiveDevice} */activeDevice) {
    var activePage = activeDevice.getState("activePage")

    activeDevice.setState(activePage + ' - Fader - Title', "")
    activeDevice.setState(activePage + ' - Fader - ValueTitles', "")
    activeDevice.setState(activePage + ' - Fader - Values', "")
    activeDevice.setState(activePage + ' - Pan - Title', "")
    activeDevice.setState(activePage + ' - Pan - ValueTitles', "")
    activeDevice.setState(activePage + ' - Pan - Values', "")

    activeDevice.setState("displayType", "Fader")
}
mixerPage.mOnActivate = (function (/** @type {MR_ActiveDevice} */activeDevice) {
    console.log('from script: Platform M+ page "Mixer" activated')
    activeDevice.setState("activePage", "Mixer")
    clearAllLeds(activeDevice, midiOutput)
    clearChannelState(activeDevice)
}).bind({ midiOutput })

selectedTrackPage.mOnActivate = (function (/** @type {MR_ActiveDevice} */activeDevice) {
    console.log('from script: Platform M+ page "Selected Track" activated')
    activeDevice.setState("activePage", "SelectedTrack")
    clearAllLeds(activeDevice, midiOutput)
    clearChannelState(activeDevice)
}).bind({ midiOutput })

// WIP Add Channel Strip Page
// channelStripPage.mOnActivate = (function (/** @type {MR_ActiveDevice} */activeDevice) {
//     console.log('from script: Platform M+ page "Channel Strip" activated')
//     activeDevice.setState("activePage", "ChannelStrip")
//     clearAllLeds(activeDevice, midiOutput)
//     clearChannelState(activeDevice)
// }).bind({ midiOutput })

