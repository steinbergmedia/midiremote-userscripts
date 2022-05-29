// Icon Platform M+ midi Remote
// Robert Woodcock
//
// Portions of this implementation where inspired by other midi remote creates to whom I wish to say thank you!
// - Mackie C4 by Ron Garrison <ron.garrison@gmail.com> https://github.com/rwgarrison/midiremote-userscripts

var iconElements = require('./icon_elements.js')
var channelControl = iconElements.channelControl
var masterControl = iconElements.masterControl
var Transport = iconElements.Transport

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

deviceDriver.mOnActivate = function (activeDevice) {
    console.log('Icon Platform M+ Initialized');
};

// define all possible namings the devices MIDI ports could have
// NOTE: Windows and MacOS handle port naming differently
// deviceDriver.makeDetectionUnit().detectPortPair(midiInput, midiOutput)
//     .expectInputNameEquals('Platform M+ V2.15') // Platform M+ v2.15
//     .expectOutputNameEquals('Platform M+ V2.15') // Platform M+ v2.15
deviceDriver.makeDetectionUnit().detectPortPair(midiInput, midiOutput)
    .expectInputNameContains('Platform M+')
    .expectOutputNameContains('Platform M+')
// ? I wonder if this can be figured out?
// .expectSysexIdentityResponse(/*vendor id (1 or 3 bytes, here: 3 bytes)*/'00n1n2', /*device family*/'n1n2', /*model number*/'n1n2')

var surface = deviceDriver.mSurface

//-----------------------------------------------------------------------------
// 2. SURFACE LAYOUT - create control elements and midi bindings
//-----------------------------------------------------------------------------
function makeSurfaceElements() {
    var surfaceElements = {}

    surfaceElements.numStrips = 8

    surfaceElements.channelControls = {}

    var xKnobStrip = 0
    var yKnobStrip = 0

    for (var i = 0; i < surfaceElements.numStrips; ++i) {
        surfaceElements.channelControls[i] = new channelControl(surface, midiInput, midiOutput, xKnobStrip, yKnobStrip, i)
    }

    surfaceElements.faderMaster = new masterControl(surface, midiInput, midiOutput, xKnobStrip + 1, yKnobStrip, surfaceElements.numStrips)
    surfaceElements.transport = new Transport(surface, midiInput, midiOutput, xKnobStrip + 20, yKnobStrip + 3)

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
    subPage.mOnActivate = function (activeDevice) {
        console.log(msgText)
    }
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
    var subPageJogScrub = makeSubPage(jogSubPageArea, 'Srcub')
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

    // Jog Pages - when Zoom lights are off
     // Nuge
    page.makeCommandBinding(surfaceElements.transport.jogLeftVariable, 'Transport', 'Nudge Cursor Left').setSubPage(subPageJogNudge)
    page.makeCommandBinding(surfaceElements.transport.jogRightVariable, 'Transport', 'Nudge Cursor Right').setSubPage(subPageJogNudge)
    // Scrub (Jog in Cubase)
    page.makeCommandBinding(surfaceElements.transport.jogLeftVariable, 'Transport', 'Jog Left').setSubPage(subPageJogScrub)
    page.makeCommandBinding(surfaceElements.transport.jogRightVariable, 'Transport', 'Jog Right').setSubPage(subPageJogScrub)
    // Switch between Nudge and Scrub by tapping knob
    page.makeActionBinding(surfaceElements.transport.jog_wheel.mPushValue, jogSubPageArea.mAction.mNext)

    var MasterFaderSubPageArea = page.makeSubPageArea('MasterFader')
    var subPageMasterFaderMain = makeSubPage(MasterFaderSubPageArea, 'MF_MainOut')
    var subPageMasterFaderHeadphone = makeSubPage(MasterFaderSubPageArea, 'MF_HeadphoneOut')
    var subPageMasterCMain = makeSubPage(MasterFaderSubPageArea, 'MF_CMain')
    var subPageMasterFaderValue = makeSubPage(MasterFaderSubPageArea, 'MF_ValueUnderCursor')

    // Master Fader
    // If there is only One output it will be Main
    // If there is more than one out then this will be the first one - there doesn't appear to be a way to verify this
    var outputMixerBanks = page.mHostAccess.mMixConsole.makeMixerBankZone().includeOutputChannels()
    var outputMixerBankChannels = outputMixerBanks.makeMixerBankChannel()
    page.makeValueBinding(surfaceElements.faderMaster.fader.mSurfaceValue, outputMixerBankChannels.mValue.mVolume).setValueTakeOverModeJump().setSubPage(subPageMasterFaderMain)
    page.makeValueBinding(surfaceElements.faderMaster.fader.mSurfaceValue, page.mHostAccess.mMouseCursor.mValueUnderMouse).setValueTakeOverModeJump().setSubPage(subPageMasterFaderValue)
    page.makeValueBinding(surfaceElements.faderMaster.fader.mSurfaceValue, page.mHostAccess.mControlRoom.getPhonesChannelByIndex(0).mLevelValue).setValueTakeOverModeJump().setSubPage(subPageMasterFaderHeadphone)
    page.makeValueBinding(surfaceElements.faderMaster.fader.mSurfaceValue, page.mHostAccess.mControlRoom.mMainChannel.mLevelValue).setValueTakeOverModeJump().setSubPage(subPageMasterCMain)
    // Switch Master Fader to Main Out->Headphone->Value Under Cursor (AI)
    page.makeActionBinding(surfaceElements.faderMaster.mixer_button.mSurfaceValue, MasterFaderSubPageArea.mAction.mNext)

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

    var hostMixerBankZone = page.mHostAccess.mMixConsole.makeMixerBankZone()
        .excludeOutputChannels()
        .excludeInputChannels()

    for (var channelIndex = 0; channelIndex < surfaceElements.numStrips; ++channelIndex) {
        var hostMixerBankChannel = hostMixerBankZone.makeMixerBankChannel()

        var knobSurfaceValue = surfaceElements.channelControls[channelIndex].pushEncoder.mEncoderValue;
        var knobPushValue = surfaceElements.channelControls[channelIndex].pushEncoder.mPushValue;
        var faderSurfaceValue = surfaceElements.channelControls[channelIndex].fader.mSurfaceValue;
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
    var page = makePageWithDefaults('Selected Track')

    var selectedTrackChannel = page.mHostAccess.mTrackSelection.mMixerChannel


    for (var idx = 0; idx < surfaceElements.numStrips; ++idx) {
        var knobSurfaceValue = surfaceElements.channelControls[idx].pushEncoder.mEncoderValue;
        var knobPushValue = surfaceElements.channelControls[idx].pushEncoder.mPushValue;
        var faderSurfaceValue = surfaceElements.channelControls[idx].fader.mSurfaceValue;

        page.makeValueBinding(knobSurfaceValue, selectedTrackChannel.mSends.getByIndex(idx).mLevel)
        page.makeValueBinding(knobPushValue, selectedTrackChannel.mSends.getByIndex(idx).mOn).setTypeToggle()
        page.makeValueBinding(faderSurfaceValue, page.mHostAccess.mFocusedQuickControls.getByIndex(idx)).setValueTakeOverModeJump()
    }

    page.makeValueBinding(surfaceElements.channelControls[6].sel_button.mSurfaceValue, selectedTrackChannel.mValue.mEditorOpen).setTypeToggle()
    page.makeValueBinding(surfaceElements.channelControls[6].mute_button.mSurfaceValue, selectedTrackChannel.mValue.mInstrumentOpen).setTypeToggle()
    page.makeCommandBinding(surfaceElements.channelControls[6].solo_button.mSurfaceValue, 'Automation', 'Show Used Automation (Selected Tracks)')
    page.makeCommandBinding(surfaceElements.channelControls[6].rec_button.mSurfaceValue, 'Automation', 'Hide Automation')

    page.makeValueBinding(surfaceElements.channelControls[7].sel_button.mSurfaceValue, selectedTrackChannel.mValue.mMonitorEnable).setTypeToggle()
    page.makeValueBinding(surfaceElements.channelControls[7].mute_button.mSurfaceValue, selectedTrackChannel.mValue.mMute).setTypeToggle()
    page.makeValueBinding(surfaceElements.channelControls[7].solo_button.mSurfaceValue, selectedTrackChannel.mValue.mSolo).setTypeToggle()
    page.makeValueBinding(surfaceElements.channelControls[7].rec_button.mSurfaceValue, selectedTrackChannel.mValue.mRecordEnable).setTypeToggle()

    return page
}

var mixerPage = makePageMixer()
var selectedTrackPage = makePageSelectedTrack()
// var quadPage = makePageQuad()

mixerPage.mOnActivate = function (device) {
    console.log('from script: Platform M+ page "Mixer" activated')
}

selectedTrackPage.mOnActivate = function (device) {
    console.log('from script: Platform M+ page "Selected Track" activated')
}
