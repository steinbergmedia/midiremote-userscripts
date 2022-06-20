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

// Fader
const const_FaderTouch = 0x68

// Upper Zone
const const_Solo = 0x08
const const_Mute = 0x10
const const_Arm = 0x00
const const_Shift = 0x46
const const_Bypass = 0x03
const const_Touch = 0x4D
const const_Write = 0x4B
const const_Read = 0x4A

// Middle Zone
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

// Transport  Zone
const const_Loop = 0x56
const const_RWD = 0x5B
const const_FWD = 0x5C
const const_Stop = 0x5D
const const_Play = 0x5E
const const_Record = 0x5F

// Helper Variables

// Saves the last Position of the Knob
var var_prev_Rotary = -1

// Pages
const Pages = {
    c_Page_None: 0x01,
    c_Page_Pan: 0x02,
    c_Page_Channel: 0x03,
    c_Page_Scroll: 0x04,
    c_Page_Master: 0x05,
    c_Page_Section: 0x06,
    c_Page_Marker: 0x07,
    c_Page_Zoom: 0x08,
    c_Page_Zoom_Vertical: 0x09
} 

var var_Active_Page = Pages.c_Page_None


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

var clz_UpperButtons = deviceDriver.mSurface.makeControlLayerZone('Upper Buttons')
var cl_upperButtons = clz_UpperButtons.makeControlLayer('Upper Buttons')

var clz_MiddleButtons = deviceDriver.mSurface.makeControlLayerZone('Middle Buttons')
var cl_middleButtons = clz_MiddleButtons.makeControlLayer('Middle Buttons')

var clz_TransportButtons = deviceDriver.mSurface.makeControlLayerZone('Transport Buttons')
var cl_TransportButtons = clz_TransportButtons.makeControlLayer('Transport Buttons')

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
    p_Page.makeValueBinding(p_upperButtonss.btn_Solo.mSurfaceValue, mixerChannel.mValue.mSolo)
        .setTypeToggle()
    p_Page.makeValueBinding(p_upperButtonss.btn_Mute.mSurfaceValue, mixerChannel.mValue.mMute)
        .setTypeToggle()
    p_Page.makeValueBinding(p_upperButtonss.btn_Arm.mSurfaceValue, mixerChannel.mValue.mRecordEnable)
        .setTypeToggle()
    p_Page.makeActionBinding(p_upperButtonss.btn_Shift.mSurfaceValue, p_PageShift.mAction.mActivate)
    
    p_Page.makeValueBinding(p_upperButtonss.btn_Bypass.mSurfaceValue, mixerChannel.mCueSends.mBypass)
        .setTypeToggle()
    p_Page.makeCommandBinding(p_upperButtonss.btn_Touch.mSurfaceValue, 'Audio Performance', 'Reset Processing Overload Indicator')
    p_Page.makeValueBinding(p_upperButtonss.btn_Write.mSurfaceValue, mixerChannel.mValue.mAutomationWrite)
        .setTypeToggle()
    p_Page.makeValueBinding(p_upperButtonss.btn_Read.mSurfaceValue, mixerChannel.mValue.mAutomationRead)
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

    // Scrolling through Channels doesn't work yet
    //middleButtons.kb_Rotary_Channel_Left = deviceDriver.mSurface.makeCustomValueVariable("kb_Rotary_Channel_Left")
    //middleButtons.kb_Rotary_Channel_Right = deviceDriver.mSurface.makeCustomValueVariable("kb_Rotary_Channel_Right")   
    
    middleButtons.kb_Rotary_Scroll_Left = deviceDriver.mSurface.makeCustomValueVariable("kb_Rotary_Scroll_Left")
    middleButtons.kb_Rotary_Scroll_Right = deviceDriver.mSurface.makeCustomValueVariable("kb_Rotary_Scroll_Right")

    middleButtons.kb_Rotary_Section_Left = deviceDriver.mSurface.makeCustomValueVariable("kb_Rotary_Section_Left")
    middleButtons.kb_Rotary_Section_Right = deviceDriver.mSurface.makeCustomValueVariable("kb_Rotary_Section_Right")   

    middleButtons.kb_Rotary_Marker_Left = deviceDriver.mSurface.makeCustomValueVariable("kb_Rotary_Marker_Left")
    middleButtons.kb_Rotary_Marker_Right = deviceDriver.mSurface.makeCustomValueVariable("kb_Rotary_Marker_Right")   

    middleButtons.kb_Rotary_Zoom_Left = deviceDriver.mSurface.makeCustomValueVariable("kb_Rotary_Zoom_Left")
    middleButtons.kb_Rotary_Zoom_Right = deviceDriver.mSurface.makeCustomValueVariable("kb_Rotary_Zoom_Right")   

    middleButtons.kb_Rotary_Zoom_Vertical_Left = deviceDriver.mSurface.makeCustomValueVariable("kb_Rotary_Zoom_Vertical_Left")
    middleButtons.kb_Rotary_Zoom_Vertical_Right = deviceDriver.mSurface.makeCustomValueVariable("kb_Rotary_Zoom_Vertical_Right")   

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
        
        // Evaluate if knob is turned right or left
        const Direction = {
            c_Direction_None: 0x00,
            c_Direction_Left: 0x01,
            c_Direction_Right: 0x02
        }
        var var_Direction = Direction.c_Direction_None
        
        if (var_prev_Rotary == -1)
            var_prev_Rotary = value
        else {
            if (var_prev_Rotary == 1 && value == 1) {
                var_Direction = Direction.c_Direction_Right
            } else if (var_prev_Rotary == 0 && value == 0) {
                var_Direction = Direction.c_Direction_Left
            } else if (var_prev_Rotary < value) {
                var_Direction = Direction.c_Direction_Right
            } else if (var_prev_Rotary > value) {
                var_Direction = Direction.c_Direction_Left
            } else {
                var_Direction = Direction.c_Direction_None
            }
            var_prev_Rotary = value
        }

        // Fill the to the page corresponding variables
        switch (var_Active_Page) {
            case Pages.c_Page_None:
                break
            case Pages.c_Page_Pan:
                break
            case Pages.c_Page_Channel:
                // Scrolling through channels doesn't work yet
                /**
                switch (var_Direction) {
                    case Direction.c_Direction_Left:
                        middleButtons.kb_Rotary_Channel_Left.setProcessValue(context, 1)  
                        break
                    case Direction.c_Direction_Right:
                        middleButtons.kb_Rotary_Channel_Right.setProcessValue(context, 1)  
                        break
                }
                */
                break
            case Pages.c_Page_Scroll:
                switch (var_Direction) {
                    case Direction.c_Direction_Left:
                        middleButtons.kb_Rotary_Scroll_Left.setProcessValue(context, 1)  
                        break
                    case Direction.c_Direction_Right:
                        middleButtons.kb_Rotary_Scroll_Right.setProcessValue(context, 1)  
                        break
                }
                break
            case Pages.c_Page_Master:
                break
            case Pages.c_Page_Section:
                switch (var_Direction) {
                    case Direction.c_Direction_Left:
                        middleButtons.kb_Rotary_Section_Left.setProcessValue(context, 1)  
                        break
                    case Direction.c_Direction_Right:
                        middleButtons.kb_Rotary_Section_Right.setProcessValue(context, 1)  
                        break
                }
                break
            case Pages.c_Page_Marker:
                switch (var_Direction) {
                    case Direction.c_Direction_Left:
                        middleButtons.kb_Rotary_Marker_Left.setProcessValue(context, 1)  
                        break
                    case Direction.c_Direction_Right:
                        middleButtons.kb_Rotary_Marker_Right.setProcessValue(context, 1)  
                        break
                }
                break
            case Pages.c_Page_Zoom:
                switch (var_Direction) {
                    case Direction.c_Direction_Left:
                        middleButtons.kb_Rotary_Zoom_Left.setProcessValue(context, 1)  
                        break
                    case Direction.c_Direction_Right:
                        middleButtons.kb_Rotary_Zoom_Right.setProcessValue(context, 1)  
                        break
                }
                break
            case Pages.c_Page_Zoom_Vertical:
                switch (var_Direction) {
                    case Direction.c_Direction_Left:
                        middleButtons.kb_Rotary_Zoom_Vertical_Left.setProcessValue(context, 1)  
                        break
                    case Direction.c_Direction_Right:
                        middleButtons.kb_Rotary_Zoom_Vertical_Right.setProcessValue(context, 1)  
                        break
                }
                break                
        }

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
    var sba_SubPageArea = p_Page.makeSubPageArea('Knob Area')
    var subpage_Pan = sba_SubPageArea.makeSubPage('Pan')
    var subpage_Channel = sba_SubPageArea.makeSubPage('Channel')
    var subpage_Scroll =  sba_SubPageArea.makeSubPage('Scroll')
    var subpage_Master = sba_SubPageArea.makeSubPage('Master')
    var subpage_Section = sba_SubPageArea.makeSubPage('Section')
    var subpage_Marker = sba_SubPageArea.makeSubPage('Marker')

    var sba_SubPageArea_Shift = p_PageShift.makeSubPageArea('Knob Area Shift')
    var subpage_Zoom = sba_SubPageArea_Shift.makeSubPage('Zoom')
    var subpage_Zoom_Vertical = sba_SubPageArea_Shift.makeSubPage('Zoom_Vertical')

    subpage_Pan.mActivate

    /**********************************
     * Normal page
     */
    // Pan
    p_Page.makeActionBinding(p_middleButtons.btn_Pan.mSurfaceValue, subpage_Pan.mAction.mActivate)
        .setSubPage(subpage_Pan)
        .setSubPage(subpage_Channel)
        .setSubPage(subpage_Scroll)
        .setSubPage(subpage_Master)
        .setSubPage(subpage_Section)
        .setSubPage(subpage_Marker)     
    p_Page.makeValueBinding(p_middleButtons.kb_Rotary.mSurfaceValue, p_Page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mPan)
        .setSubPage(subpage_Pan)    
    p_Page.makeValueBinding(p_middleButtons.btn_RotaryPush.mSurfaceValue, p_Page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mMonitorEnable)
        .setSubPage(subpage_Pan)
        .setTypeToggle()
    p_Page.makeActionBinding(p_middleButtons.btn_PrevTrack.mSurfaceValue, p_Page.mHostAccess.mTrackSelection.mAction.mPrevTrack)    
        .setSubPage(subpage_Pan)
    p_Page.makeActionBinding(p_middleButtons.btn_NextTrack.mSurfaceValue, p_Page.mHostAccess.mTrackSelection.mAction.mNextTrack)
        .setSubPage(subpage_Pan)

    // Channel
    p_Page.makeActionBinding(p_middleButtons.btn_Channel.mSurfaceValue, subpage_Channel.mAction.mActivate)
        .setSubPage(subpage_Pan)
        .setSubPage(subpage_Channel)
        .setSubPage(subpage_Scroll)
        .setSubPage(subpage_Master)
        .setSubPage(subpage_Section)
        .setSubPage(subpage_Marker)     
    p_Page.makeValueBinding(p_middleButtons.kb_Rotary.mSurfaceValue, p_Page.mHostAccess.mMouseCursor.mValueUnderMouse)
        .setSubPage(subpage_Channel)
    p_Page.makeActionBinding(p_middleButtons.btn_PrevTrack.mSurfaceValue, p_Page.mHostAccess.mTrackSelection.mAction.mPrevTrack)    
        .setSubPage(subpage_Channel)
    p_Page.makeActionBinding(p_middleButtons.btn_NextTrack.mSurfaceValue, p_Page.mHostAccess.mTrackSelection.mAction.mNextTrack)
        .setSubPage(subpage_Channel)        
    // Scrolling through channels doesn't work yet
    //p_Page.makeActionBinding(p_middleButtons.kb_Rotary_Channel_Left, p_Page.mHostAccess.mTrackSelection.mAction.mPrevTrack)    
    //    .setSubPage(subpage_Channel)
    //p_Page.makeActionBinding(p_middleButtons.kb_Rotary_Channel_Right, p_Page.mHostAccess.mTrackSelection.mAction.mNextTrack)
    //    .setSubPage(subpage_Channel)
    //p_Page.makeCommandBinding(p_middleButtons.kb_Rotary_Channel_Left, 'Project', 'Select Track: Prev')
    //    .setSubPage(subpage_Channel)
    //p_Page.makeCommandBinding(p_middleButtons.kb_Rotary_Channel_Right, 'Project', 'Select Track: Next')
    //    .setSubPage(subpage_Channel)

    // Scroll
    p_Page.makeActionBinding(p_middleButtons.btn_Scroll.mSurfaceValue, subpage_Scroll.mAction.mActivate)
        .setSubPage(subpage_Pan)
        .setSubPage(subpage_Channel)
        .setSubPage(subpage_Scroll)
        .setSubPage(subpage_Master)
        .setSubPage(subpage_Section)
        .setSubPage(subpage_Marker)     
    p_Page.makeCommandBinding(p_middleButtons.btn_PrevTrack.mSurfaceValue, 'Transport', 'Nudge Cursor Left')
        .setSubPage(subpage_Scroll)
    p_Page.makeCommandBinding(p_middleButtons.btn_NextTrack.mSurfaceValue, 'Transport', 'Nudge Cursor Right')
        .setSubPage(subpage_Scroll)
    p_Page.makeCommandBinding(p_middleButtons.kb_Rotary_Scroll_Left, 'Transport', 'Nudge Cursor Left')
        .setSubPage(subpage_Scroll)
    p_Page.makeCommandBinding(p_middleButtons.kb_Rotary_Scroll_Right, 'Transport', 'Nudge Cursor Right')
        .setSubPage(subpage_Scroll)

    // Master
    p_Page.makeActionBinding(p_middleButtons.btn_Master.mSurfaceValue, subpage_Master.mAction.mActivate)
        .setSubPage(subpage_Pan)
        .setSubPage(subpage_Channel)
        .setSubPage(subpage_Scroll)
        .setSubPage(subpage_Master)
        .setSubPage(subpage_Section)
        .setSubPage(subpage_Marker)     
    p_Page.makeValueBinding(p_middleButtons.kb_Rotary.mSurfaceValue, p_Page.mHostAccess.mControlRoom.mMainChannel.mLevelValue)
        .setSubPage(subpage_Master)
    
    // Section
    p_Page.makeActionBinding(p_middleButtons.btn_Section.mSurfaceValue, subpage_Section.mAction.mActivate)
        .setSubPage(subpage_Pan)
        .setSubPage(subpage_Channel)
        .setSubPage(subpage_Scroll)
        .setSubPage(subpage_Master)
        .setSubPage(subpage_Section)
        .setSubPage(subpage_Marker)    
    p_Page.makeCommandBinding(p_middleButtons.btn_PrevTrack.mSurfaceValue, 'Nudge', 'Left')
        .setSubPage(subpage_Section)
    p_Page.makeCommandBinding(p_middleButtons.btn_NextTrack.mSurfaceValue, 'Nudge', 'Right')
        .setSubPage(subpage_Section)
    p_Page.makeCommandBinding(p_middleButtons.kb_Rotary_Section_Left, 'Nudge', 'Left')
        .setSubPage(subpage_Section)
    p_Page.makeCommandBinding(p_middleButtons.kb_Rotary_Section_Right, 'Nudge', 'Right')
        .setSubPage(subpage_Section)        

    // Marker
    p_Page.makeActionBinding(p_middleButtons.btn_Marker.mSurfaceValue, subpage_Marker.mAction.mActivate)
        .setSubPage(subpage_Pan)
        .setSubPage(subpage_Channel)
        .setSubPage(subpage_Scroll)
        .setSubPage(subpage_Master)
        .setSubPage(subpage_Section)
        .setSubPage(subpage_Marker)
    p_Page.makeCommandBinding(p_middleButtons.btn_PrevTrack.mSurfaceValue, 'Transport', 'Locate Previous Marker')
        .setSubPage(subpage_Marker)
    p_Page.makeCommandBinding(p_middleButtons.btn_NextTrack.mSurfaceValue, 'Transport', 'Locate Next Marker')
        .setSubPage(subpage_Marker)
    p_Page.makeCommandBinding(p_middleButtons.kb_Rotary_Marker_Left, 'Transport', 'Locate Previous Marker')
        .setSubPage(subpage_Marker)
    p_Page.makeCommandBinding(p_middleButtons.kb_Rotary_Marker_Right, 'Transport', 'Locate Next Marker')
        .setSubPage(subpage_Marker)

    // Open Channel Editor
    p_Page.makeValueBinding(p_middleButtons.btn_Link.mSurfaceValue, p_Page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mEditorOpen)
        .setTypeToggle()
    
    // Click
    p_Page.makeValueBinding(p_middleButtons.btn_Click.mSurfaceValue, p_Page.mHostAccess.mTransport.mValue.mMetronomeActive)
        .setTypeToggle()
    
    // Pan Page Handler
    subpage_Pan.mOnActivate = function(context) {
        setColorLED(context, const_Link, RGB_Colors.c_Blue)
        setColorLED(context, const_Pan, RGB_Colors.c_Blue)
        setColorLED(context, const_Channel, RGB_Colors.c_Blue)
        setColorLED(context, const_Scroll, RGB_Colors.c_Blue)

        turnOffLED(context, const_Link)
        turnOnLED(context, const_Pan)
        turnOffLED(context, const_Channel)
        turnOffLED(context, const_Scroll)
        turnOffLED(context, const_Master)
        turnOffLED(context, const_Section)
        turnOffLED(context, const_Marker)

        var_Active_Page = Pages.c_Page_Pan
    }
    subpage_Pan.mOnDeactivate = function(context) {
        turnOffLED(context, const_Pan)

        var_Active_Page = Pages.c_Page_None
    }

    // Channel Page Handler
    subpage_Channel.mOnActivate = function(context) {
        setColorLED(context, const_Link, RGB_Colors.c_Blue)
        setColorLED(context, const_Pan, RGB_Colors.c_Blue)
        setColorLED(context, const_Channel, RGB_Colors.c_Blue)
        setColorLED(context, const_Scroll, RGB_Colors.c_Blue)

        turnOffLED(context, const_Link)
        turnOffLED(context, const_Pan)
        turnOnLED(context, const_Channel)
        turnOffLED(context, const_Scroll)
        turnOffLED(context, const_Master)
        turnOffLED(context, const_Section)
        turnOffLED(context, const_Marker)

        var_Active_Page = Pages.c_Page_Channel
    }
    subpage_Channel.mOnDeactivate = function(context) {
        turnOffLED(context, const_Channel)

        var_Active_Page = Pages.c_Page_None
    }

    // Scroll Page Handler
    subpage_Scroll.mOnActivate = function(context) {
        setColorLED(context, const_Link, RGB_Colors.c_Blue)
        setColorLED(context, const_Pan, RGB_Colors.c_Blue)
        setColorLED(context, const_Channel, RGB_Colors.c_Blue)
        setColorLED(context, const_Scroll, RGB_Colors.c_Blue)

        turnOffLED(context, const_Link)
        turnOffLED(context, const_Pan)
        turnOffLED(context, const_Channel)
        turnOnLED(context, const_Scroll)
        turnOffLED(context, const_Master)
        turnOffLED(context, const_Section)
        turnOffLED(context, const_Marker)

        var_Active_Page = Pages.c_Page_Scroll
    }
    subpage_Scroll.mOnDeactivate = function(context) {
        turnOffLED(context, const_Scroll)

        var_Active_Page = Pages.c_Page_None
    }  

    // Master Page Handler
    subpage_Master.mOnActivate = function(context) {
        setColorLED(context, const_Link, RGB_Colors.c_Blue)
        setColorLED(context, const_Pan, RGB_Colors.c_Blue)
        setColorLED(context, const_Channel, RGB_Colors.c_Blue)
        setColorLED(context, const_Scroll, RGB_Colors.c_Blue)

        turnOffLED(context, const_Link)
        turnOffLED(context, const_Pan)
        turnOffLED(context, const_Channel)
        turnOffLED(context, const_Scroll)
        turnOnLED(context, const_Master)
        turnOffLED(context, const_Section)
        turnOffLED(context, const_Marker)

        var_Active_Page = Pages.c_Page_Master
    }
    subpage_Master.mOnDeactivate = function(context) {
        turnOffLED(context, const_Master)

        var_Active_Page = Pages.c_Page_None
    }

    // Section Page Handler
    subpage_Section.mOnActivate = function(context) {
        setColorLED(context, const_Link, RGB_Colors.c_Blue)
        setColorLED(context, const_Pan, RGB_Colors.c_Blue)
        setColorLED(context, const_Channel, RGB_Colors.c_Blue)
        setColorLED(context, const_Scroll, RGB_Colors.c_Blue)

        turnOffLED(context, const_Link)
        turnOffLED(context, const_Pan)
        turnOffLED(context, const_Channel)
        turnOffLED(context, const_Scroll)
        turnOffLED(context, const_Master)
        turnOnLED(context, const_Section)
        turnOffLED(context, const_Marker)

        var_Active_Page = Pages.c_Page_Section
    }
    subpage_Section.mOnDeactivate = function(context) {
        turnOffLED(context, const_Section)

        var_Active_Page = Pages.c_Page_None
    }

    // Marker Page Handler
    subpage_Marker.mOnActivate = function(context) {
        setColorLED(context, const_Link, RGB_Colors.c_Blue)
        setColorLED(context, const_Pan, RGB_Colors.c_Blue)
        setColorLED(context, const_Channel, RGB_Colors.c_Blue)
        setColorLED(context, const_Scroll, RGB_Colors.c_Blue)

        turnOffLED(context, const_Link)
        turnOffLED(context, const_Pan)
        turnOffLED(context, const_Channel)
        turnOffLED(context, const_Scroll)
        turnOffLED(context, const_Master)
        turnOffLED(context, const_Section)
        turnOnLED(context, const_Marker)

        var_Active_Page = Pages.c_Page_Marker
    }
    subpage_Marker.mOnDeactivate = function(context) {
        turnOffLED(context, const_Marker)

        var_Active_Page = Pages.c_Page_None
    }

    /**********************************
     * Shift page
     */
    var mixerChannel = p_PageShift.mHostAccess.mTrackSelection.mMixerChannel
    p_PageShift.makeValueBinding(p_middleButtons.btn_Link.mSurfaceValue, mixerChannel.mValue.mInstrumentOpen)
        .setTypeToggle()

    // Zoom Button
    p_PageShift.makeActionBinding(p_middleButtons.btn_Scroll.mSurfaceValue, subpage_Zoom.mAction.mActivate)
        .setSubPage(subpage_Zoom)
        .setSubPage(subpage_Zoom_Vertical)
    p_PageShift.makeCommandBinding(p_middleButtons.btn_PrevTrack.mSurfaceValue, 'Zoom', 'Zoom Out')
        .setSubPage(subpage_Zoom)
    p_PageShift.makeCommandBinding(p_middleButtons.btn_NextTrack.mSurfaceValue, 'Zoom', 'Zoom In')
        .setSubPage(subpage_Zoom)
    p_PageShift.makeCommandBinding(p_middleButtons.kb_Rotary_Zoom_Left, 'Zoom', 'Zoom Out')
        .setSubPage(subpage_Zoom)
    p_PageShift.makeCommandBinding(p_middleButtons.kb_Rotary_Zoom_Right, 'Zoom', 'Zoom In')
        .setSubPage(subpage_Zoom)        
 
    // Zoom Button
    p_PageShift.makeActionBinding(p_middleButtons.btn_Channel.mSurfaceValue, subpage_Zoom_Vertical.mAction.mActivate)
        .setSubPage(subpage_Zoom)
        .setSubPage(subpage_Zoom_Vertical)
    p_PageShift.makeCommandBinding(p_middleButtons.btn_PrevTrack.mSurfaceValue, 'Zoom', 'Zoom Out Vertically')
        .setSubPage(subpage_Zoom_Vertical)
    p_PageShift.makeCommandBinding(p_middleButtons.btn_NextTrack.mSurfaceValue, 'Zoom', 'Zoom In Vertically')
        .setSubPage(subpage_Zoom_Vertical)
    p_PageShift.makeCommandBinding(p_middleButtons.kb_Rotary_Zoom_Vertical_Left, 'Zoom', 'Zoom Out Vertically')
        .setSubPage(subpage_Zoom_Vertical)
    p_PageShift.makeCommandBinding(p_middleButtons.kb_Rotary_Zoom_Vertical_Right, 'Zoom', 'Zoom In Vertically')
        .setSubPage(subpage_Zoom_Vertical)        

    // F1 to F4
    p_PageShift.makeCommandBinding(p_middleButtons.btn_Master.mSurfaceValue, 'Quantize Category', 'Set Quantize to 2th')
    p_PageShift.makeCommandBinding(p_middleButtons.btn_Click.mSurfaceValue, 'Quantize Category', 'Set Quantize to 4th')
    p_PageShift.makeCommandBinding(p_middleButtons.btn_Section.mSurfaceValue, 'Quantize Category', 'Set Quantize to 8th')
    p_PageShift.makeCommandBinding(p_middleButtons.btn_Marker.mSurfaceValue, 'Quantize Category', 'Set Quantize to 16th')

    // Zoom Page Handler
    subpage_Zoom.mOnActivate = function(context) {
        turnOffLED(context, const_Link)
        turnOffLED(context, const_Pan)
        turnOffLED(context, const_Channel)
        turnOnLED(context, const_Scroll)
        turnOffLED(context, const_Master)
        turnOffLED(context, const_Section)
        turnOffLED(context, const_Marker)

        var_Active_Page = Pages.c_Page_Zoom
    }
    subpage_Zoom.mOnDeactivate = function(context) {
        turnOnLED(context, const_Scroll)

        var_Active_Page = Pages.c_Page_None
    }

    // Zoom Vertical Page Handler
    subpage_Zoom_Vertical.mOnActivate = function(context) {
        turnOffLED(context, const_Link)
        turnOffLED(context, const_Pan)
        turnOnLED(context, const_Channel)
        turnOffLED(context, const_Scroll)
        turnOffLED(context, const_Master)
        turnOffLED(context, const_Section)
        turnOffLED(context, const_Marker)

        var_Active_Page = Pages.c_Page_Zoom_Vertical
    }
    subpage_Zoom_Vertical.mOnDeactivate = function(context) {
        turnOnLED(context, const_Scroll)

        var_Active_Page = Pages.c_Page_None
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
