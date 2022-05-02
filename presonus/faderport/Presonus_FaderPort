//-----------------------------------------------------------------------------
// 1. DRIVER SETUP - create driver object, midi ports and detection information
//-----------------------------------------------------------------------------

// get the api's entry point
var midiremote_api = require('midiremote_api_v1')

// create the device driver main object
var deviceDriver = midiremote_api.makeDeviceDriver('PreSonus', 'FaderPort', 'WEM Music')

// create objects representing the hardware's MIDI ports
var midiInput = deviceDriver.mPorts.makeMidiInput()
var midiOutput = deviceDriver.mPorts.makeMidiOutput()
  
deviceDriver.makeDetectionUnit().detectPortPair(midiInput, midiOutput)
    .expectInputNameEquals('PreSonus FP2')
    .expectOutputNameEquals('PreSonus FP2')

//-----------------------------------------------------------------------------
// 2. SURFACE LAYOUT - create control elements and midi bindings
//-----------------------------------------------------------------------------

/** Definitions
 * 
 */

const const_FaderTouch = 0x68

// Upper
const const_Solo = 0x08
const const_Mute = 0x10
const const_Arm = 0x00
const const_Shift = 0x46
const const_Bypass = 0x03
const const_Touch = 0x4D
const const_Write = 0x4B
const const_Read = 0x4A

// Middle
const const_PrevTrack = 0x2E
const const_Rotary = 0x10
const const_RotaryPush = 0x20
const const_NextTrack = 0x2F

const const_Link = 0x05
const const_Pan = 0x2A
const const_Channel = 0x36
const const_Scroll = 0x38
const const_Master = 0x3A
const const_Click = 0x3B
const const_Section = 0x3C
const const_Marker = 0x3D

// Transport 
const const_Loop = 0x56
const const_RWD = 0x5B
const const_FWD = 0x5C
const const_Stop = 0x5D
const const_Play = 0x5E
const const_Record = 0x5F

/** Help Functions
 * 
 */
// helpers to turn on/off the button LEDs
function turnOnLED(device, ledID)
{
    midiOutput.sendMidi(device, [ 0x90, ledID, 0x7F])
}
function turnFlashingLED(device, ledID)
{
    midiOutput.sendMidi(device, [ 0x90, ledID, 0x01])
}
function turnOffLED(device, ledID)
{
    midiOutput.sendMidi(device, [ 0x90, ledID, 0x00])
}
function setRGBLED(device, ledID, r, g, b) {
    midiOutput.sendMidi(device, [ 0x91, ledID, r])
    midiOutput.sendMidi(device, [ 0x92, ledID, g])
    midiOutput.sendMidi(device, [ 0x93, ledID, b])
}

const RGB_Colors = {
    c_Red: 0x01,
    c_Green: 0x02,
    c_Blue: 0x03
}

function setColorLED(device, ledID, p_color) {
    if (p_color == RGB_Colors.c_Red) {
        setRGBLED(device, ledID, 0x7F, 0x00, 0x00)
    } else if (p_color == RGB_Colors.c_Green) {
        setRGBLED(device, ledID, 0x00, 0x7F, 0x00)
    } else if (p_color == RGB_Colors.c_Blue) {
        setRGBLED(device, ledID, 0x00, 0x00, 0x7F)
    }
}

/** Zones
 * 
 */


var clz_ZoneFader = deviceDriver.mSurface.makeControlLayerZone('Fader')
var cl_fader = clz_ZoneFader.makeControlLayer('Fader')

var clz_UpperButtons = deviceDriver.mSurface.makeControlLayerZone('UpperButtons')
var cl_upperButtons = clz_UpperButtons.makeControlLayer('UpperButtons')

var clz_MiddleButtons = deviceDriver.mSurface.makeControlLayerZone('MiddleButtons')
var cl_middleButtons = clz_MiddleButtons.makeControlLayer('MiddleButtons')

var clz_TransportButtons = deviceDriver.mSurface.makeControlLayerZone('TransportButtons')
var cl_TransportButtons = clz_TransportButtons.makeControlLayer('TransportButtons')

/** FADER
 * 
 */

function makeFader(p_x, p_y, p_heigh) {
    var fader = {}
    // create control element representing your hardware's surface
    fader.fd_Volume = deviceDriver.mSurface.makeFader(p_x, p_y, 1, p_heigh)
        .setTypeVertical()
    fader.fd_Volume.setControlLayer(cl_fader)

    fader.val_FaderTouched = deviceDriver.mSurface.makeCustomValueVariable('FaderTouched')
    fader.val_FaderOutput = deviceDriver.mSurface.makeCustomValueVariable('FaderOutput')    

    var faderState = {
        isTouched: false,
        value: 0,
        updateHardware: function(context) {
            if(!this.isTouched)
                if (var_Debug == true)
                    console.log("updateHardware: " + this.value.toString())            
                fader.val_FaderOutput.setProcessValue(context, this.value)        
        }
    }

    fader.fd_Volume.mSurfaceValue.mOnProcessValueChange = function (context, value) {
        if (var_Debug == true)
            console.log("fd_Volume.mSurfaceValue.mOnProcessValueChange: " + value.toString())
        faderState.value = value
        faderState.updateHardware(context)
    }.bind({faderState})
    
    fader.val_FaderTouched.mOnProcessValueChange = function (context, value) {
        if (var_Debug == true)
            console.log("val_FaderTouched.mOnProcessValueChange")
        faderState.isTouched = value > 0
        faderState.updateHardware(context)
    }.bind({faderState})
   
    return fader
}

function midiBindingFader(p_fader) {
    p_fader.fd_Volume.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToPitchBend(0)

    p_fader.val_FaderTouched.mMidiBinding
        .setInputPort(midiInput)
        .bindToNote (0, const_FaderTouch)

    p_fader.val_FaderOutput.mMidiBinding
        .setOutputPort(midiOutput)
        .bindToPitchBend(0)
}

function hostBindingFader(p_fader, p_Page, p_pageShift) {
    p_Page.makeValueBinding(fader.fd_Volume.mSurfaceValue, p_Page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mVolume)   
    p_pageShift.makeValueBinding(fader.fd_Volume.mSurfaceValue, pageShift.mHostAccess.mMouseCursor.mValueUnderMouse)   
}

/** UPPER BUTTONS
 * 
 */

function makeUpperButtons(p_x, p_y) {
    var upperButtons = {}
    var x = p_x
    var y = p_y
    var width = 1
    var heigh = 1

    upperButtons.btn_Solo = deviceDriver.mSurface.makeButton(x, y, width, heigh)
    upperButtons.btn_Solo.setControlLayer(cl_upperButtons)
    x = x + 1
    upperButtons.btn_Mute = deviceDriver.mSurface.makeButton(x, y, width, heigh)
    upperButtons.btn_Mute.setControlLayer(cl_upperButtons)
    x = x + 1
    upperButtons.btn_Arm = deviceDriver.mSurface.makeButton(x, y, width, heigh)
    upperButtons.btn_Arm.setControlLayer(cl_upperButtons)
    x = x + 1
    upperButtons.btn_Shift = deviceDriver.mSurface.makeButton(x, y, width, heigh)
    upperButtons.btn_Shift.setControlLayer(cl_upperButtons)
    x = p_x
    y = y + 1
    upperButtons.btn_Bypass = deviceDriver.mSurface.makeButton(x, y, width, heigh)
    upperButtons.btn_Bypass.setControlLayer(cl_upperButtons)
    x = x + 1
    upperButtons.btn_Touch = deviceDriver.mSurface.makeButton(x, y, width, heigh)
    upperButtons.btn_Touch.setControlLayer(cl_upperButtons)
    x = x + 1
    upperButtons.btn_Write = deviceDriver.mSurface.makeButton(x, y, width, heigh)
    upperButtons.btn_Write.setControlLayer(cl_upperButtons)
    x = x + 1
    upperButtons.btn_Read = deviceDriver.mSurface.makeButton(x, y, width, heigh)
    upperButtons.btn_Read.setControlLayer(cl_upperButtons)

    upperButtons.btn_Solo.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if (value) {
            turnOnLED(context, const_Solo)
        } else {
            turnOffLED(context, const_Solo)
        }
    }

    upperButtons.btn_Mute.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if (value) {
            turnOnLED(context, const_Mute)
        } else {
            turnOffLED(context, const_Mute)
        }
    }

    upperButtons.btn_Arm.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if (value) {
            turnOnLED(context, const_Arm)
        } else {
            turnOffLED(context, const_Arm)
        }
    }

    upperButtons.btn_Bypass.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if (value) {
            turnOnLED(context, const_Bypass)
        } else {
            turnOffLED(context, const_Bypass)
        }
    }

    upperButtons.btn_Write.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if (value) {
            turnOnLED(context, const_Write)
            setColorLED(context, const_Write, RGB_Colors.c_Red)
        } else {
            turnOffLED(context, const_Write)
        }
    }

    upperButtons.btn_Read.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if (value) {
            turnOnLED(context, const_Read)
            setColorLED(context, const_Read, RGB_Colors.c_Green)
        } else {
            turnOffLED(context, const_Read)
        }
    }

    return upperButtons
}

function midiBindingUpperButtons(p_upperButtons) {
    p_upperButtons.btn_Solo.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToNote (0, const_Solo)

    p_upperButtons.btn_Mute.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToNote (0, const_Mute)    

    p_upperButtons.btn_Arm.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToNote (0, const_Arm)    
    
    p_upperButtons.btn_Shift.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToNote (0, const_Shift)    
    
    p_upperButtons.btn_Bypass.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToNote (0, const_Bypass)    
    
    p_upperButtons.btn_Touch.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToNote (0, const_Touch)

    p_upperButtons.btn_Write.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToNote (0, const_Write)

    p_upperButtons.btn_Read.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToNote (0, const_Read)
}

function hostBindingUpperButtons(p_upperButtonss, p_Page, p_PageShift) {
    var mixerChannel = page.mHostAccess.mTrackSelection.mMixerChannel
    page.makeValueBinding(p_upperButtonss.btn_Solo.mSurfaceValue, mixerChannel.mValue.mSolo)
        .setTypeToggle()
    page.makeValueBinding(p_upperButtonss.btn_Mute.mSurfaceValue, mixerChannel.mValue.mMute)
        .setTypeToggle()
    page.makeValueBinding(p_upperButtonss.btn_Arm.mSurfaceValue, mixerChannel.mValue.mRecordEnable)
        .setTypeToggle()
    page.makeActionBinding(p_upperButtonss.btn_Shift.mSurfaceValue, p_PageShift.mAction.mActivate)
    page.makeValueBinding(p_upperButtonss.btn_Bypass.mSurfaceValue, mixerChannel.mCueSends.mBypass)
        .setTypeToggle()
    page.makeValueBinding(p_upperButtonss.btn_Touch.mSurfaceValue, mixerChannel.mValue.mInstrumentOpen)
        .setTypeToggle()
    page.makeValueBinding(p_upperButtonss.btn_Write.mSurfaceValue, mixerChannel.mValue.mAutomationWrite)
        .setTypeToggle()
    page.makeValueBinding(p_upperButtonss.btn_Read.mSurfaceValue, mixerChannel.mValue.mAutomationRead)
        .setTypeToggle()

    var mixerChannel_pageShift = p_PageShift.mHostAccess.mTrackSelection.mMixerChannel
    p_PageShift.makeActionBinding(p_upperButtonss.btn_Shift.mSurfaceValue, p_Page.mAction.mActivate)

    p_PageShift.makeValueBinding(p_upperButtonss.btn_Solo.mSurfaceValue, mixerChannel_pageShift.mValue.mSolo)
        .setTypeToggle()
    p_PageShift.makeValueBinding(p_upperButtonss.btn_Mute.mSurfaceValue, mixerChannel_pageShift.mValue.mMute)
        .setTypeToggle()

    p_PageShift.mOnActivate = function(context) {
        turnFlashingLED(context, const_Shift)
    }

    p_Page.mOnActivate = function(context) {
        turnOffLED(context, const_Shift)
    }
}

/** MIDDLE BUTTONS
 * 
 */
function makeMiddleButtons(p_x, p_y) {
    var middleButtons = {}
    var x = p_x
    var y = p_y
    var width = 1
    var heigh = 1

    middleButtons.btn_PrevTrack = deviceDriver.mSurface.makeButton(x, y + 0.25, width, heigh / 2)
        .setControlLayer(cl_middleButtons)    
    
    middleButtons.pnl_KnobPanel = deviceDriver.mSurface.makeBlindPanel(x + 1, y - 0.25, width * 2, heigh + 0.5)

    middleButtons.kb_Rotary = deviceDriver.mSurface.makeKnob(x + 1 + 0.25, y, width - 0.2, heigh - 0.2)
        .setControlLayer(cl_middleButtons)
    
    middleButtons.btn_RotaryPush = deviceDriver.mSurface.makeButton(x + 2.25, y, width - 0.5, heigh - 0.5)
        .setControlLayer(cl_middleButtons)
        .setShapeCircle()

    middleButtons.pnl_KnobLabel = deviceDriver.mSurface.makeLabelField(x + 1.25, y + 0.75, width * 2 - 0.5, 0.25)
        .relateTo(middleButtons.kb_Rotary)

    middleButtons.btn_NextTrack = deviceDriver.mSurface.makeButton(x + 3, y + 0.25, width, heigh/2)
        .setControlLayer(cl_middleButtons)

    y = y + 1.5
    middleButtons.btn_Link = deviceDriver.mSurface.makeButton(x, y, width, heigh)
        .setControlLayer(cl_middleButtons)
    x = x + 1
    middleButtons.btn_Pan = deviceDriver.mSurface.makeButton(x, y, width, heigh)
        .setControlLayer(cl_middleButtons)
    x = x + 1
    middleButtons.btn_Channel = deviceDriver.mSurface.makeButton(x, y, width, heigh)
        .setControlLayer(cl_middleButtons)
    x = x + 1
    middleButtons.btn_Scroll = deviceDriver.mSurface.makeButton(x, y, width, heigh)
        .setControlLayer(cl_middleButtons)
    x = p_x
    y = y + 1
    middleButtons.btn_Master = deviceDriver.mSurface.makeButton(x, y, width, heigh)
        .setControlLayer(cl_middleButtons)
    x = x + 1
    middleButtons.btn_Click = deviceDriver.mSurface.makeButton(x, y, width, heigh)
        .setControlLayer(cl_middleButtons)
    x = x + 1
    middleButtons.btn_Section = deviceDriver.mSurface.makeButton(x, y, width, heigh)
        .setControlLayer(cl_middleButtons)
    x = x + 1
    middleButtons.btn_Marker = deviceDriver.mSurface.makeButton(x, y, width, heigh)
        .setControlLayer(cl_middleButtons)

    middleButtons.kb_Rotary.mSurfaceValue.mOnProcessValueChange = function (context, value) {
        if (var_Debug == true)
            console.log("kb_Rotary.mSurfaceValue.mOnProcessValueChange: " + value.toString())
    }
    
    middleButtons.btn_PrevTrack.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if (value) {
            turnOnLED(context, const_PrevTrack)
        } else {
            turnOffLED(context, const_PrevTrack)
        }
    }

    middleButtons.btn_NextTrack.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if (value) {
            turnOnLED(context, const_NextTrack)
        } else {
            turnOffLED(context, const_NextTrack)
        }
    }

    middleButtons.btn_Link.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if (value) {
            turnOnLED(context, const_Link)
        } else {
            turnOffLED(context, const_Link)
        }
    }

    middleButtons.btn_Click.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if (value) {
            turnOnLED(context, const_Click)
        } else {
            turnOffLED(context, const_Click)
        }
    }  

    return middleButtons
}

function midiBindingMiddleButtons(p_middleButtons) {
    p_middleButtons.btn_PrevTrack.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToNote (0, const_PrevTrack)
    
    p_middleButtons.kb_Rotary.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToControlChange(0, const_Rotary)
        .setTypeRelativeSignedBit()

    p_middleButtons.btn_RotaryPush.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToNote(0, const_RotaryPush)

    p_middleButtons.btn_NextTrack.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToNote (0, const_NextTrack)

    p_middleButtons.btn_Link.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToNote (0, const_Link)

    p_middleButtons.btn_Pan.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToNote (0, const_Pan)

    p_middleButtons.btn_Channel.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToNote (0, const_Channel)

    p_middleButtons.btn_Scroll.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToNote (0, const_Scroll)
    
    p_middleButtons.btn_Master.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToNote (0, const_Master)
    
    p_middleButtons.btn_Click.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToNote (0, const_Click)
    
    p_middleButtons.btn_Section.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToNote (0, const_Section)
    
    p_middleButtons.btn_Marker.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToNote (0, const_Marker)
}

function hostBindingMiddleButtons(p_middleButtons, p_Page, p_PageShift) {
    p_Page.makeActionBinding(p_middleButtons.btn_PrevTrack.mSurfaceValue, p_Page.mHostAccess.mTrackSelection.mAction.mPrevTrack)
    p_Page.makeActionBinding(p_middleButtons.btn_NextTrack.mSurfaceValue, p_Page.mHostAccess.mTrackSelection.mAction.mNextTrack)

    var sba_SubPageArea = p_Page.makeSubPageArea('Knob Area')
    var subpage_Pan = sba_SubPageArea.makeSubPage('Pan')
    var subpage_Channel = sba_SubPageArea.makeSubPage('Channel')
    var subpage_Scroll =  sba_SubPageArea.makeSubPage('Scroll')
    var subpage_Master = sba_SubPageArea.makeSubPage('Master')
    var subpage_Section = sba_SubPageArea.makeSubPage('Section')
    var subpage_Marker = sba_SubPageArea.makeSubPage('Marker')

    // Pan
    p_Page.makeValueBinding(p_middleButtons.kb_Rotary.mSurfaceValue, p_Page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mPan)
        .setSubPage(subpage_Pan)
    p_Page.makeValueBinding(p_middleButtons.btn_RotaryPush.mSurfaceValue, p_Page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mMonitorEnable)
        .setSubPage(subpage_Pan)
        .setTypeToggle()

    // Channel
    //p_Page.makeValueBinding(p_middleButtons.kb_Rotary.mSurfaceValue, p_Page.mHostAccess.)
    //    .setSubPage(subpage_Scroll)

    // Scroll
    p_Page.makeValueBinding(p_middleButtons.kb_Rotary.mSurfaceValue, p_Page.mHostAccess.mMouseCursor.mValueUnderMouse)
        .setSubPage(subpage_Scroll)

    // Master
    p_Page.makeValueBinding(p_middleButtons.kb_Rotary.mSurfaceValue, p_Page.mHostAccess.mControlRoom.mReferenceLevelValue)
        .setSubPage(subpage_Master)
    
    // Section

    // Marker

    //p_Page.makeValueBinding(p_middleButtons.btn_RotaryPush.mSurfaceValue, p_Page.mHostAccess.mMouseCursor.mValueUnderMouse)
    //    .setSubPage(subpage_Master)
    //    .setTypeToggle()

    p_Page.makeValueBinding(p_middleButtons.btn_Link.mSurfaceValue, p_Page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mEditorOpen)
        .setTypeToggle()

    p_Page.makeActionBinding(p_middleButtons.btn_Pan.mSurfaceValue, subpage_Pan.mAction.mActivate)
    p_Page.makeActionBinding(p_middleButtons.btn_Channel.mSurfaceValue, subpage_Channel.mAction.mActivate)
    p_Page.makeActionBinding(p_middleButtons.btn_Scroll.mSurfaceValue, subpage_Scroll.mAction.mActivate)    
    p_Page.makeActionBinding(p_middleButtons.btn_Master.mSurfaceValue, subpage_Master.mAction.mActivate)
    
    p_Page.makeValueBinding(p_middleButtons.btn_Click.mSurfaceValue, p_Page.mHostAccess.mTransport.mValue.mMetronomeActive)
        .setTypeToggle()
    
    p_Page.makeActionBinding(p_middleButtons.btn_Section.mSurfaceValue, subpage_Section.mAction.mActivate)
    p_Page.makeActionBinding(p_middleButtons.btn_Marker.mSurfaceValue, subpage_Marker.mAction.mActivate)

    subpage_Pan.mOnActivate = function(context) {
        turnOffLED(context, const_Link)
        turnOnLED(context, const_Pan)
        turnOffLED(context, const_Channel)
        turnOffLED(context, const_Scroll)
        turnOffLED(context, const_Master)
        turnOffLED(context, const_Section)
        turnOffLED(context, const_Marker)
    }
    subpage_Pan.mOnDeactivate = function(context) {
        turnOffLED(context, const_Pan)
    }

    subpage_Channel.mOnActivate = function(context) {
        turnOffLED(context, const_Link)
        turnOffLED(context, const_Pan)
        turnOnLED(context, const_Channel)
        turnOffLED(context, const_Scroll)
        turnOffLED(context, const_Master)
        turnOffLED(context, const_Section)
        turnOffLED(context, const_Marker)
    }
    subpage_Channel.mOnDeactivate = function(context) {
        turnOffLED(context, const_Channel)
    }

    subpage_Scroll.mOnActivate = function(context) {
        turnOffLED(context, const_Link)
        turnOffLED(context, const_Pan)
        turnOffLED(context, const_Channel)
        turnOnLED(context, const_Scroll)
        turnOffLED(context, const_Master)
        turnOffLED(context, const_Section)
        turnOffLED(context, const_Marker)
    }
    subpage_Scroll.mOnDeactivate = function(context) {
        turnOffLED(context, const_Scroll)
    }  

    subpage_Master.mOnActivate = function(context) {
        turnOffLED(context, const_Link)
        turnOffLED(context, const_Pan)
        turnOffLED(context, const_Channel)
        turnOffLED(context, const_Scroll)
        turnOnLED(context, const_Master)
        turnOffLED(context, const_Section)
        turnOffLED(context, const_Marker)
    }
    subpage_Master.mOnDeactivate = function(context) {
        turnOffLED(context, const_Master)
    }

    subpage_Section.mOnActivate = function(context) {
        turnOffLED(context, const_Link)
        turnOffLED(context, const_Pan)
        turnOffLED(context, const_Channel)
        turnOffLED(context, const_Scroll)
        turnOffLED(context, const_Master)
        turnOnLED(context, const_Section)
        turnOffLED(context, const_Marker)
    }
    subpage_Section.mOnDeactivate = function(context) {
        turnOffLED(context, const_Section)
    }

    subpage_Marker.mOnActivate = function(context) {
        turnOffLED(context, const_Link)
        turnOffLED(context, const_Pan)
        turnOffLED(context, const_Channel)
        turnOffLED(context, const_Scroll)
        turnOffLED(context, const_Master)
        turnOffLED(context, const_Section)
        turnOnLED(context, const_Marker)
    }
    subpage_Marker.mOnDeactivate = function(context) {
        turnOffLED(context, const_Marker)
    }
}

/** TRANSPORT BUTTONS
 * 
 */

function makeTransportButtons(p_x, p_y) {
    var transportButtons = {}
    var x = p_x
    var y = p_y
    var width = 1
    var heigh = 1

    transportButtons.btn_Loop = deviceDriver.mSurface.makeButton(x + 0.5, y, width, heigh)
        .setShapeCircle()
        .setControlLayer(cl_TransportButtons)    

    transportButtons.btn_RWD = deviceDriver.mSurface.makeButton(x + 1.5, y, width, heigh)
        .setShapeCircle()
        .setControlLayer(cl_TransportButtons)    

    transportButtons.btn_FWD = deviceDriver.mSurface.makeButton(x + 2.5, y, width, heigh)
        .setShapeCircle()
        .setControlLayer(cl_TransportButtons)    

    transportButtons.btn_Stop = deviceDriver.mSurface.makeButton(x + 0.25, y + 1, width, heigh)
        .setShapeCircle()
        .setControlLayer(cl_TransportButtons)    

    transportButtons.btn_Play = deviceDriver.mSurface.makeButton(x + 1.375, y + 1.125, width * 1.25, heigh* 1.25)
        .setShapeCircle()
        .setControlLayer(cl_TransportButtons)    

    transportButtons.btn_Record = deviceDriver.mSurface.makeButton(x + 2.75, y + 1, width, heigh)
        .setShapeCircle()
        .setControlLayer(cl_TransportButtons)

    transportButtons.btn_Loop.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if (value) {
            turnOnLED(context, const_Loop)
        } else {
            turnOffLED(context, const_Loop)
        }
    }

    transportButtons.btn_Stop.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if (value) {
            turnOnLED(context, const_Stop)
        } else {
            turnOffLED(context, const_Stop)
        }
    }

    transportButtons.btn_Play.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if (value) {
            turnOffLED(context, const_Stop)
            turnOnLED(context, const_Play)
        } else {
            turnOnLED(context, const_Stop)
            turnOffLED(context, const_Play)
        }
    }

    transportButtons.btn_Record.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if (value) {
            turnOffLED(context, const_Stop)
            turnOnLED(context, const_Record)
            turnOnLED(context, const_Play)
        } else {
            turnOffLED(context, const_Record)
        }
    }

    transportButtons.btn_RWD.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if (!value) {
            turnOffLED(context, const_RWD)
        } else {
            turnOnLED(context, const_RWD)
        }
    }

    transportButtons.btn_FWD.mSurfaceValue.mOnProcessValueChange = function(context, value) {
        if (!value) {
            turnOffLED(context, const_FWD)
        } else {
            turnOnLED(context, const_FWD)
        }
    }

    return transportButtons  
}

function midiBindingTransportButtons(p_transportButtons) {
    p_transportButtons.btn_Loop.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToNote (0, const_Loop)    

    p_transportButtons.btn_RWD.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToNote (0, const_RWD)    

    p_transportButtons.btn_FWD.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToNote (0, const_FWD)    
    
    p_transportButtons.btn_Stop.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToNote (0, const_Stop)    
    
    p_transportButtons.btn_Play.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToNote (0, const_Play)    
    
    p_transportButtons.btn_Record.mSurfaceValue.mMidiBinding
        .setInputPort(midiInput)
        .bindToNote (0, const_Record)      
}

function hostBindingTransportButtons(p_transportButtons, p_Page, pageShift) {
    var transport = page.mHostAccess.mTransport.mValue
    page.makeValueBinding(p_transportButtons.btn_Loop.mSurfaceValue, transport.mCycleActive)
        .setTypeToggle()
    page.makeValueBinding(p_transportButtons.btn_RWD.mSurfaceValue, transport.mRewind)   
    page.makeValueBinding(p_transportButtons.btn_FWD.mSurfaceValue, transport.mForward)
    page.makeValueBinding(p_transportButtons.btn_Stop.mSurfaceValue, transport.mStop)
        .setTypeToggle()
    page.makeValueBinding(p_transportButtons.btn_Play.mSurfaceValue, transport.mStart) 
        .setTypeToggle()
    page.makeValueBinding(p_transportButtons.btn_Record.mSurfaceValue, transport.mRecord)
        .setTypeToggle()

    var transport_pageShift = pageShift.mHostAccess.mTransport.mValue
    pageShift.makeValueBinding(p_transportButtons.btn_Loop.mSurfaceValue, transport_pageShift.mCycleActive)
        .setTypeToggle()
    pageShift.makeValueBinding(p_transportButtons.btn_RWD.mSurfaceValue, transport_pageShift.mRewind)   
    pageShift.makeValueBinding(p_transportButtons.btn_FWD.mSurfaceValue, transport_pageShift.mForward)
    pageShift.makeValueBinding(p_transportButtons.btn_Stop.mSurfaceValue, transport_pageShift.mStop)
        .setTypeToggle()
    pageShift.makeValueBinding(p_transportButtons.btn_Play.mSurfaceValue, transport_pageShift.mStart) 
        .setTypeToggle()
    pageShift.makeValueBinding(p_transportButtons.btn_Record.mSurfaceValue, transport_pageShift.mRecord)
        .setTypeToggle()    
}

/** MAIN
 * 
 */
var page = deviceDriver.mMapping.makePage('PreSonus FP2 MAIN')
var pageShift = deviceDriver.mMapping.makePage('PreSonus FP2 SHIFT')
var var_Debug = false

var fader = makeFader(0, 0, 9)
midiBindingFader(fader)
hostBindingFader(fader, page, pageShift)

var upperButtons = makeUpperButtons(2, 0)
midiBindingUpperButtons(upperButtons)
hostBindingUpperButtons(upperButtons, page, pageShift)

var middleButtons = makeMiddleButtons(2, 3)
midiBindingMiddleButtons(middleButtons)
hostBindingMiddleButtons(middleButtons, page, pageShift)

var transportButtons = makeTransportButtons(2, 7)
midiBindingTransportButtons(transportButtons)
hostBindingTransportButtons(transportButtons, page, pageShift)
