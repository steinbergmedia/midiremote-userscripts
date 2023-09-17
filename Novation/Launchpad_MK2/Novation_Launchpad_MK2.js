//-----------------------------------------------------------------------------
// 1. DRIVER SETUP - create driver object, midi ports and detection information
//-----------------------------------------------------------------------------

// get the API's entry point
const gMidiRemoteApi = require('midiremote_api_v1')

// create the device driver main object
const gDeviceDriver = gMidiRemoteApi.makeDeviceDriver(
    'Novation',
    'Launchpad MK2',
    'gyatskov'
)

// create objects representing the hardware's MIDI ports
const gMidiInput = gDeviceDriver.mPorts.makeMidiInput()
const gMidiOutput = gDeviceDriver.mPorts.makeMidiOutput()

// define all possible namings the devices MIDI ports could have
// NOTE: Windows and MacOS handle port naming differently
gDeviceDriver.makeDetectionUnit()
    .detectPortPair(gMidiInput, gMidiOutput)
    .expectInputNameContains('Launchpad MK2')
    .expectOutputNameContains('Launchpad MK2')


/**
 * Default MIDI channel mapping.
 */
const midiChannels = {
    session: 0,

    // NOTE: Depends on bootloader settings
    user1: 5, // (6-1)
    // NOTE: Depends on bootloader settings
    user2: 5, // (6-1)

    flashOn: 2,
    flashOff: 1,

    pulseOn: 2,
    pulseOff: 1,
}

/**
 * Mode name to ID mapping supported by the Launchpad hardware.
 */
const modes = {
    session: 0x00,
    user1: 0x01,
    user2: 0x02,
    //reservedForAbletonLive: 0x03,
    volume: 0x04,
    pan: 0x05,
}

/**
 * Constructs a MIDI message representing a mode change.
 * 
 * @param {string} modeName Low level mode name (see modes)
 * @returns {number[]}
 */
function changeButtonLayoutMessage(modeName) {
    const modeCode = modes[modeName]
    const message = [0xF0, 0x00, 0x20, 0x29, 0x02, 0x18, 0x22, modeCode, 0xF7]
    return message
}

/**
 * Sends MIDI messages to the midiOutput.
 * 
 * @param {MR_ActiveDevice} context
 * @param {number[]} message Array of bytes
 */
function sendMidi(context, message) {
    gMidiOutput.sendMidi(context, message)
}

/**
 * Constants used for selecting fader modes (see `initFaders`).
 */
const faderType = {
    volume: 0x00,
    pan: 0x01,
}

/**
 * Initializes virtual faders.
 * 
 * @pre According mode (volume or pan) must be active
 * @param {*} context 
 * @param {number} type 
 * @param {*} color 
 * @param {*} initialValue 
 */
function initFaders(context, type, color, initialValue) {
    for(var idx = 0; idx < 8; idx++) {
        const msg = [0xF0, 0x00, 0x29, 0x02, 0x18, 0x2B, idx, type, color, initialValue, 0xF7]
        sendMidi(context, msg)
    }
}

/**
 * Page to launchpad mode name mapping.
 */
const pageToModeMapping = {
    daw:     'session',
    mixer:   'session',
    drumpad: 'user1',
    volume:  'volume',
    pan:     'pan'
}

/**
 * Activates a mode on the Launchpad.
 * 
 * @param {MR_ActiveDevice} context
 * @param {string} mode
 */
function setMode(context, mode)
{
    const msg = changeButtonLayoutMessage(pageToModeMapping[mode])
    sendMidi(context, msg)
}

gDeviceDriver.mOnActivate = function (/** @type {MR_ActiveDevice} */ context ) {
  // CONSIDER: Remember initial state?
  // Optional initial messages to be sent to the device on activation
  const messages = [];

  messages.forEach(function (message) {
    sendMidi(context, message)
  });

  // initialize with DAW mode
  setMode(context, 'daw')

  console.log('INIT Novation Launchpad Integration');
};

gDeviceDriver.mOnDeactivate = function(/** @type {MR_ActiveDevice} */ context ) {
    // CONSIDER: Restore initial state?
    // Leave device in daw state after shutting down
    // clean up with DAW mode
    setMode(context, 'daw')

    // Optional ending messages to be sent to the device on deactivation
    const messages = [];

    messages.forEach(function (message) {
        sendMidi(context, message)
    });

    console.log('SHUTDOWN Novation Launchpad Integration');
}

//-----------------------------------------------------------------------------
// 2. SURFACE LAYOUT - create control elements and midi bindings
//-----------------------------------------------------------------------------

/**
 * Binds button to MIDI note of a specific channel to both input and output.
 * 
 * @param {{ mSurfaceValue: { mMidiBinding: { setInputPort: (arg0: MR_DeviceMidiInput) => { (): any; new (): any; setOutputPort: { (arg0: MR_DeviceMidiOutput): { (): any; new (): any; bindToNote: { (arg0: any, arg1: any): void; new (): any; }; }; new (): any; }; }; }; }; }} button
 * @param {number} chn
 * @param {number} pitch MIDI note pitch value between 0 and 127
 */
function bindMidiNote(button, chn, pitch) {
    button.mSurfaceValue.mMidiBinding
        .setInputPort(gMidiInput)
        .setOutputPort(gMidiOutput)
        .bindToNote(chn, pitch)
}

/**
 * Binds button to MIDI CC of a specific channel to both input and output.
 * 
 * @param {{ mSurfaceValue: { mMidiBinding: { setInputPort: (arg0: MR_DeviceMidiInput) => { (): any; new (): any; setOutputPort: { (arg0: MR_DeviceMidiOutput): { (): any; new (): any; bindToControlChange: { (arg0: any, arg1: any): void; new (): any; }; }; new (): any; }; }; }; }; }} button
 * @param {number} chn
 * @param {number} value CC value between 0 and 127
 */
function bindMidiCC(button, chn, value) {
    button.mSurfaceValue.mMidiBinding
        .setInputPort(gMidiInput)
        .setOutputPort(gMidiOutput)
        .bindToControlChange(chn, value) 
}

/**
 * Binds header buttons (up, down, left, right, session, user1, user2, mixer)
 * to CCs.
 * 
 * @param {{}} headerButtons
 * @param {number} channel MIDI channel
 */
function bindMidiHeaderButtons(headerButtons, channel) {
    const startCC = 0x68
    var idx = 0

    for(var key in headerButtons)
    {
        bindMidiCC(headerButtons[key], channel, startCC + idx)
        idx+=1
    }
}

/**
 * Binds 8x8 matrix to 8 vertical fader/pan channels.
 * 
 * @param {*} pads8x8 2D matrix of trigger pads.
 * @param {number} channel MIDI channel
 */
function bindPadsFader(pads8x8, channel) {
    const startCC = 0x15

    for(var row = 7; row >= 0; row--)
    {
        const padRow = pads8x8[row]
        for(var col = 0; col < 8; col++)
        {
            const pad = padRow[col]
            bindMidiCC(pad, channel, startCC+col)
        }
    }
}
/** 
 * Creates the buttons at the top of the Launchpad.
 * @returns the buttons at the top of the Launchpad
 */
function createHeaderButtons() {
    var headerButtonXOffset = 0
    const headerButtonXDelta = 1
    const y = 0
    const w = 1
    const h = 1
    const headerButtons = {
      up: gDeviceDriver.mSurface.makeButton((headerButtonXOffset++)*headerButtonXDelta, y, w, h),
      down: gDeviceDriver.mSurface.makeButton((headerButtonXOffset++)*headerButtonXDelta, y, w, h),
      left: gDeviceDriver.mSurface.makeButton((headerButtonXOffset++)*headerButtonXDelta, y, w, h),
      right: gDeviceDriver.mSurface.makeButton((headerButtonXOffset++)*headerButtonXDelta, y, w, h),

      session: gDeviceDriver.mSurface.makeButton((headerButtonXOffset++)*headerButtonXDelta, y, w, h),
      user1: gDeviceDriver.mSurface.makeButton((headerButtonXOffset++)*headerButtonXDelta, y, w, h),
      user2: gDeviceDriver.mSurface.makeButton((headerButtonXOffset++)*headerButtonXDelta, y, w, h),

      mixer: gDeviceDriver.mSurface.makeButton((headerButtonXOffset++)*headerButtonXDelta, y, w, h),
    }
    return headerButtons
}

/** 
 * Creates the buttons on the right side of the Launchpad.
 * @returns the buttons on the right side of the Launchpad
 */
function createSideButtons() {
    var sideButtonYOffset = 1
    const sideButtonXOffset = 8
    const sideButtonYDelta = 1
    const sideButtons = {
      volume: gDeviceDriver.mSurface.makeButton(sideButtonXOffset, (sideButtonYOffset++)*sideButtonYDelta, 1, 1),
      pan: gDeviceDriver.mSurface.makeButton(   sideButtonXOffset, (sideButtonYOffset++)*sideButtonYDelta, 1, 1),
      sendA: gDeviceDriver.mSurface.makeButton( sideButtonXOffset, (sideButtonYOffset++)*sideButtonYDelta, 1, 1),
      sendB: gDeviceDriver.mSurface.makeButton( sideButtonXOffset, (sideButtonYOffset++)*sideButtonYDelta, 1, 1),
      
      stop: gDeviceDriver.mSurface.makeButton(  sideButtonXOffset, (sideButtonYOffset++)*sideButtonYDelta, 1, 1),
      mute: gDeviceDriver.mSurface.makeButton(  sideButtonXOffset, (sideButtonYOffset++)*sideButtonYDelta, 1, 1),
      solo: gDeviceDriver.mSurface.makeButton(  sideButtonXOffset, (sideButtonYOffset++)*sideButtonYDelta, 1, 1),
      
      record: gDeviceDriver.mSurface.makeButton(sideButtonXOffset, (sideButtonYOffset++)*sideButtonYDelta, 1, 1),
    }
    return sideButtons
}

/**
 * Creates 8x8 pad matrix, top to bottom.
 * 
 * @returns {MR_TriggerPad[][]} 8x8 pad matrix as 2D array.
 */
function create8x8pads() {
    const pads = []
    for(var i = 0; i < 8; i++)
    {
        const padRow = []
        for(var j = 0; j < 8; j++)
        {
            const w = 1;
            const h = 1;
            const x = j;
            const y = i+1; // first row reserved for CC header buttons
            const pad = gDeviceDriver.mSurface.makeTriggerPad(x, y, w, h)
            padRow.push(pad)
        }
        pads.push(padRow)
    }
    return pads
}

const gHeaderButtons = createHeaderButtons()
const gPads8x8 = create8x8pads()
const gSideButtons = createSideButtons()

/**
 * Binds pads in a 4x4 drumpad pattern.
 * 
 * @param {any[]}  pads
 * @param {object} sideButtons
 */
function bindDrumpad(pads, sideButtons) {
    /* 
     x: trigger pads
     s: side buttons

            x x x x    x x x x   s
            x x x x    x x x x   s
        1   x x x x    x x x x   s
            x x x x    x x x x   s

            x x x x    x x x x   s
            x x x x    x x x x   s
        0   x x x x    x x x x   s
            x x x x    x x x x   s
        by
           bx  0          1
    */
    const pitchMin = 0x24 // C1
    // Yes, you could unroll this loop...
    for(var bx = 0; bx < 2; bx++) {
        for(var by = 0; by < 2; by++) {

            for(var i = 0; i < 4; i++) {
                // 0..7
                const rowIdx = (7 - by*4 - i)
                const row = pads[rowIdx]
                for(var j = 0; j < 4; j++) {
                    // 0..7
                    const colIdx = bx*4 + j
                    const pad = row[colIdx]
                    const pitch = pitchMin + bx*32 + by*16 + i*4 + j;
                    bindMidiNote(pad, midiChannels.user1, pitch)
                }
            }
        }
    }

    const pitchSide = 0x64
    const sideButtonKeys = Object.keys(sideButtons)
    for(var i = 0; i < 8; i++)
    {
        const button = sideButtons[sideButtonKeys[i]]
        const pitch = pitchSide+i;
        bindMidiNote(button, midiChannels.user1, pitch)
    }
}

/**
 * Binds 8x8 trigger pads for DAW mode (piecewise linear).
 * 
 * @param {any[][]} pads 2D array of trigger pads
 * @param {object} sideButtons
 */
function bindDAW(pads, sideButtons) {
    const sideButtonKeys = Object.keys(sideButtons)
    for(var i = 0; i < 8; i++)
    {
        const pitchOffset = 0x59;
        const padRow = pads[i]
        const button = sideButtons[sideButtonKeys[i]]
        const rowOffset = i;
        const rowStride = i*9;
        bindMidiNote(button, midiChannels.session, pitchOffset - (rowStride + rowOffset))
        for(var j = 7; j >= 0; j--)
        {
            const pad = padRow[j]
            const col = (8-j)
            const pitch = pitchOffset - (rowStride + col + rowOffset)
            bindMidiNote(pad, midiChannels.session, pitch)
        }
    }
}

//-----------------------------------------------------------------------------
// 3. HOST MAPPING - create mapping pages and host bindings
//-----------------------------------------------------------------------------

/**
 * Defines mappings which shall be common to all pages.
 * 
 * @param {*} pages
 * @param {*} headerButtons
 * @param {MR_HostDefaults} _hostDefaults
 * @param {MR_DeviceMidiOutput} _midiOutput
 */
function appendDefaultsToPages(pages, headerButtons, _hostDefaults, _midiOutput) {
    for(var key in pages)
    {
        const page = pages[key]
        
        page.makeActionBinding(headerButtons.session.mSurfaceValue, pages['daw'].mAction.mActivate)
        page.makeActionBinding(headerButtons.user1.mSurfaceValue, pages['drumpad'].mAction.mActivate)
        // CONSIDER: Using alternative mappings for user2
        page.makeActionBinding(headerButtons.user2.mSurfaceValue, pages['daw'].mAction.mActivate)

        page.makeCommandBinding(headerButtons.mixer.mSurfaceValue, 'Devices', 'Mixer')
    }
}

// create mapping pages
const pages = {
    daw:     gDeviceDriver.mMapping.makePage('DAW'),
    drumpad: gDeviceDriver.mMapping.makePage('Drumpad'),
    mixer:   gDeviceDriver.mMapping.makePage('Mixer'),
    volume:  gDeviceDriver.mMapping.makePage('Volume'),
    pan:     gDeviceDriver.mMapping.makePage('Pan'),
}

appendDefaultsToPages(pages, gHeaderButtons, gMidiRemoteApi.mDefaults, gMidiOutput)

// Initialize individual pages
function setPageHandlers() {
    pages.daw.mOnActivate = function(/** @type {MR_ActiveDevice} */ context){
        setMode(context, 'daw')
        bindDAW(gPads8x8, gSideButtons)

        bindMidiHeaderButtons(gHeaderButtons, midiChannels.session)
    }

    pages.drumpad.mOnActivate = function(/** @type {MR_ActiveDevice} */ context){
        setMode(context, 'drumpad')
        bindDrumpad(gPads8x8, gSideButtons)

        bindMidiHeaderButtons(gHeaderButtons, midiChannels.user1)
    }

    pages.mixer.mOnActivate = function(/** @type {MR_ActiveDevice} */ context){
        setMode(context, 'mixer')
    }

    pages.volume.mOnActivate = function(/** @type {MR_ActiveDevice} */ context){
        setMode(context, 'volume')

        bindMidiHeaderButtons(gHeaderButtons, midiChannels.session)

        const initialValue = 0x00
        const color = 0x23
        initFaders(context, faderType.volume, color, initialValue)
        bindPadsFader(gPads8x8, midiChannels.session)
    }

    pages.pan.mOnActivate = function(/** @type {MR_ActiveDevice} */ context){
        setMode(context, 'pan')

        bindMidiHeaderButtons(gHeaderButtons, midiChannels.session)

        const initialValue = 0x00
        const color = 0x33
        initFaders(context, faderType.pan, color, initialValue)
        bindPadsFader(gPads8x8, midiChannels.session)
    }
}

// create host accessing objects
// Initialize daw page
function initPageDAW()
{
    const page = pages.daw
    const host = page.mHostAccess

    const hostSelectedTrackChannel = host.mTrackSelection.mMixerChannel
    // bind surface elements to host accessing object values
    page.makeActionBinding(gHeaderButtons.up.mSurfaceValue, host.mTrackSelection.mAction.mPrevTrack)
    page.makeActionBinding(gHeaderButtons.down.mSurfaceValue, host.mTrackSelection.mAction.mNextTrack)

    page.makeCommandBinding(gHeaderButtons.left.mSurfaceValue, 'Transport', 'Locate Previous Event')
    page.makeCommandBinding(gHeaderButtons.right.mSurfaceValue, 'Transport', 'Locate Next Event')

    page.makeActionBinding(gSideButtons.volume.mSurfaceValue, pages['volume'].mAction.mActivate)
    page.makeActionBinding(gSideButtons.pan.mSurfaceValue, pages['pan'].mAction.mActivate)
    // Unused yet
    //page.makeValueBinding(sideButtons.sendA.mSurfaceValue, host.mTransport.mValue.mStart).setTypeToggle()
    //page.makeValueBinding(sideButtons.sendB.mSurfaceValue, hostSelectedTrackChannel.mValue.mMute).setTypeToggle()

    // side buttons
    page.makeValueBinding(gSideButtons.stop.mSurfaceValue, host.mTransport.mValue.mStart).setTypeToggle()
    page.makeValueBinding(gSideButtons.mute.mSurfaceValue, hostSelectedTrackChannel.mValue.mMute).setTypeToggle()
    page.makeValueBinding(gSideButtons.solo.mSurfaceValue, hostSelectedTrackChannel.mValue.mSolo).setTypeToggle()
    page.makeValueBinding(gSideButtons.record.mSurfaceValue, host.mTransport.mValue.mRecord).setTypeToggle()
}

function initPageMixer()
{
    const page = pages.mixer
    const host = page.mHostAccess

    const hostSelectedTrackChannel = host.mTrackSelection.mMixerChannel
    // bind surface elements to host accessing object values
    const bankZone = host.mMixConsole.makeMixerBankZone('All').includeAudioChannels().includeMIDIChannels()
    page.makeValueBinding(gHeaderButtons.up.mSurfaceValue, hostSelectedTrackChannel.mValue.mVolume)
    page.makeValueBinding(gHeaderButtons.down.mSurfaceValue, hostSelectedTrackChannel.mSends.getByIndex(0).mLevel)

    // Unused yet
    //page.makeValueBinding(sideButtons.sendA.mSurfaceValue, host.mTransport.mValue.mStart).setTypeToggle()
    //page.makeValueBinding(sideButtons.sendB.mSurfaceValue, hostSelectedTrackChannel.mValue.mMute).setTypeToggle()

    page.makeActionBinding(gHeaderButtons.left.mSurfaceValue, bankZone.mAction.mPrevBank)
    page.makeActionBinding(gHeaderButtons.right.mSurfaceValue, bankZone.mAction.mNextBank)
}

function initPageVolume()
{
    const page = pages.volume
    const host = page.mHostAccess

    const hostSelectedTrackChannel = host.mTrackSelection.mMixerChannel
    // bind surface elements to host accessing object values
    const bankZone = host.mMixConsole.makeMixerBankZone('All').includeAudioChannels().includeMIDIChannels()
    page.makeValueBinding(gHeaderButtons.up.mSurfaceValue, hostSelectedTrackChannel.mValue.mVolume)
    page.makeValueBinding(gHeaderButtons.down.mSurfaceValue, hostSelectedTrackChannel.mSends.getByIndex(0).mLevel)

    // Unused yet
    //page.makeValueBinding(sideButtons.sendA.mSurfaceValue, host.mTransport.mValue.mStart).setTypeToggle()
    //page.makeValueBinding(sideButtons.sendB.mSurfaceValue, hostSelectedTrackChannel.mValue.mMute).setTypeToggle()

    page.makeActionBinding(gHeaderButtons.left.mSurfaceValue, bankZone.mAction.mPrevBank)
    page.makeActionBinding(gHeaderButtons.right.mSurfaceValue, bankZone.mAction.mNextBank)
}

setPageHandlers()
initPageDAW()
initPageMixer()
initPageVolume()