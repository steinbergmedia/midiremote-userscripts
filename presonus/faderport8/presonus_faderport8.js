//-----------------------------------------------------------------------------
// This script is written for FaderPort8 MIDI Mode only
// At the moment it does not support all buttons, but I will release upgrades 
// and changes the will improve usability.
// At the moment the faders control tracks volume and eq. 
// To change page press 'Edit Plugins' button
//-----------------------------------------------------------------------------

// get the api's entry point
var midiremote_api = require('midiremote_api_v1');

var device = DeviceDriver();
var hostMapper = HostMapper(device);
var faderPort = FaderPort(device);
var knobScene = 0 ; // a number between 0 and 3 that determines the function of the navigation knob
faderPort.init();

function DeviceDriver() {
    var driver;
    var midiInput; 
    var midiOutput;
    this.initMidi = function() {
        driver = midiremote_api.makeDeviceDriver('PreSonus', 'FaderPort8', 'Meir Winston');
        
        midiInput = driver.mPorts.makeMidiInput()
        midiOutput = driver.mPorts.makeMidiOutput()

        driver.makeDetectionUnit().detectPortPair(midiInput, midiOutput)
            .expectInputNameEquals('MIDIIN2 (PreSonus FP8)')
            .expectOutputNameEquals('MIDIOUT2 (PreSonus FP8)')
    }

    this.initMidi();
    this.driver = driver;
    this.midiInput = midiInput;
    this.midiOutput = midiOutput;
    
    return this;
}

//-- Pan --//

function FaderPort(device) {
    var deviceDriver = device.driver;
    var midiInput = device.midiInput;
    var midiOutput = device.midiOutput;
    var panKnob;
    var panKnobPush;
    var channelButton;
    var zoomButton;
    var scrollButton;
    var bankButton;
    var masterButton;
    var clickButton;
    var sectionButton;
    var markerButton;
    var trackButton;
    var pluginsButton;
    var numBankItems = 8;

    this.init = function() {
        this.initPluginsButton();

        this.initPanKnob();
        this.initChannelButton();
        this.initClickButton();
        this.initMarkerButton();
        this.initMasterButton();
        this.initScrollButton();
        this.initBankButton();
        this.initSectionButton();
        this.initTrackButton();
        this.initZoomButton();

        this.initNavigationKnob(22, 0);
        this.initFaders();
    }

    // -- Right column buttons -- //

    this.initTrackButton = function() {
        trackButton = deviceDriver.mSurface.makeButton(19, 0, 2, 1);
        trackButton.mSurfaceValue.mMidiBinding
            .setInputPort(midiInput)
            .setOutputPort(midiOutput)
            .bindToControlChange (0, 0);
        
    }

    this.initPluginsButton = function() {
        pluginsButton = deviceDriver.mSurface.makeButton(19, 1, 2, 1);
        pluginsButton.mSurfaceValue.mMidiBinding
            .setInputPort(midiInput)
            .setOutputPort(midiOutput)
            .bindToControlChange (4, 24);
        hostMapper.mapPluginsButton(pluginsButton);     
    }

    this.initPanKnob = function() {
        panKnob = deviceDriver.mSurface.makeKnob(0, 0, 2, 2);
        panKnob.mSurfaceValue.mMidiBinding
            .setInputPort(midiInput)
            .setOutputPort(midiOutput)
            .bindToControlChange (0, 48);
        
        panKnobPush = deviceDriver.mSurface.makeButton(0, 2, 2, 1);
        panKnobPush.mSurfaceValue.mMidiBinding
            .setInputPort(midiInput)
            .setOutputPort(midiOutput)
            .bindToControlChange (0, 23);

        hostMapper.mapPanKnob(panKnob);
    }

    this.initChannelButton = function() {
        // -- 25,26,27,28,29,30,31,85 -- //

        channelButton = deviceDriver.mSurface.makeButton(28, 0, 2, 1);
        channelButton.mSurfaceValue.mMidiBinding
            .setInputPort(midiInput)
            .setOutputPort(midiOutput)
            .bindToControlChange (5, 25);

        channelButton.mSurfaceValue.mOnProcessValueChange = function (context, newValue) {
            knobScene = 0;
            console.log("channel " + knobScene);
            
            // midiOutput.sendMidi(context,  [0xB0, 7, 127]); //b0 = control change + channel, 7 midi, 
            midiOutput.sendMidi(context,  [0xB5, 7, 127]); //cc
        }
    }

    this.initZoomButton = function() {
        zoomButton = deviceDriver.mSurface.makeButton(30, 0, 2, 1);
        zoomButton.mSurfaceValue.mMidiBinding
            .setInputPort(midiInput).setOutputPort(midiOutput)
            .bindToControlChange (5, 26);
        zoomButton.mSurfaceValue.mOnProcessValueChange = function (context, newValue) {
            knobScene = 1;
            console.log("zoom " + knobScene);
        }
    }

    this.initScrollButton = function() {
        scrollButton = deviceDriver.mSurface.makeButton(32, 0, 2, 1);
        scrollButton.mSurfaceValue.mMidiBinding
            .setInputPort(midiInput).setOutputPort(midiOutput)
            .bindToControlChange (5, 27)
        scrollButton.mSurfaceValue.mOnProcessValueChange = function (context, newValue) {
            knobScene = 2;
            console.log("scroll " + knobScene);
        }
    }

    this.initBankButton = function() {
        bankButton = deviceDriver.mSurface.makeButton(34, 0, 2, 1);
        bankButton.mSurfaceValue.mMidiBinding
            .setInputPort(midiInput).setOutputPort(midiOutput)
            .bindToControlChange (5, 28);
        bankButton.mSurfaceValue.mOnProcessValueChange = function (context, newValue) {
            knobScene = 3;
            console.log("bank " + knobScene);
        }
    }

    //-- master/click/section/marker --//

    this.initMasterButton = function() {

        masterButton = deviceDriver.mSurface.makeButton(28, 1, 2, 1);
        masterButton.mSurfaceValue.mMidiBinding
            .setInputPort(midiInput).setOutputPort(midiOutput)
            .bindToControlChange (5, 0);
        masterButton.mSurfaceValue.mOnProcessValueChange = function (context, newValue) {
            console.log("a " + knobScene);
        }
    }

    this.initClickButton = function() {
        clickButton = deviceDriver.mSurface.makeButton(30, 1, 2, 1);
        clickButton.mSurfaceValue.mMidiBinding
            .setInputPort(midiInput).setOutputPort(midiOutput)
            .bindToControlChange (5, 0);
        clickButton.mSurfaceValue.mOnProcessValueChange = function (context, newValue) {
            console.log("a " + knobScene);
        }
    }

    this.initSectionButton = function() {
        sectionButton = deviceDriver.mSurface.makeButton(32, 1, 2, 1);
        sectionButton.mSurfaceValue.mMidiBinding
            .setInputPort(midiInput).setOutputPort(midiOutput)
            .bindToControlChange (5, 0);
        sectionButton.mSurfaceValue.mOnProcessValueChange = function (context, newValue) {
            console.log("a " + knobScene);
        }
    }

    this.initMarkerButton = function() {
        markerButton = deviceDriver.mSurface.makeButton(34, 1, 2, 1);
        markerButton.mSurfaceValue.mMidiBinding
            .setInputPort(midiInput).setOutputPort(midiOutput)
            .bindToControlChange (5, 0);
        markerButton.mSurfaceValue.mOnProcessValueChange = function (context, newValue) {
            console.log("a " + knobScene);
        }
    }

    // -- Navigation Knob -- //

    function createNavKnobButtons(x, y) {
        return [
            [
                deviceDriver.mSurface.makeButton(x, y, 2, 1),
                deviceDriver.mSurface.makeButton(x + 2, y, 2, 1)
            ],
            [
                deviceDriver.mSurface.makeButton(x, y + 1, 2, 1),
                deviceDriver.mSurface.makeButton(x + 2, y + 1, 2, 1) 
            ],
            [
                deviceDriver.mSurface.makeButton(x, y + 2, 2, 1),
                deviceDriver.mSurface.makeButton(x + 2, y + 2, 2, 1)
            ],
            [
                deviceDriver.mSurface.makeButton(x, y + 3, 2, 1),
                deviceDriver.mSurface.makeButton(x + 2, y + 3, 2, 1)
            ]
        ];
    
    }

    function createNavKnobPush(x, y) {
        var b = deviceDriver.mSurface.makeButton(x, y, 4, 1);
        b.mSurfaceValue.mMidiBinding
            .setInputPort(midiInput).setOutputPort(midiOutput)
            .bindToControlChange (5, 23);
        return b;
    }

    this.initNavigationKnob = function(x, y) {
        var navKnobButtons = createNavKnobButtons(22, 5);
        var knob = deviceDriver.mSurface.makeKnob(x, y, 4, 4);
        var lastNavKnobValue = null;
        knob.mSurfaceValue.mOnProcessValueChange = function (context, newValue) {
            if (lastNavKnobValue == null) {
    
            }
            else if (newValue == 1) {
                console.log("UP 0: " + newValue + ", scene: " + knobScene);
                navKnobButtons[knobScene][1].mSurfaceValue.setProcessValue(context, 127)
            }
            else if (newValue == 0) {
                console.log("DOWN 1: " + newValue + ", scene: " + knobScene);
                navKnobButtons[knobScene][0].mSurfaceValue.setProcessValue(context, 127)
            }
            else if (lastNavKnobValue == newValue) {
                // avoid values that can trigger the opposite direction
            }
            else if (newValue > lastNavKnobValue) {
                console.log("UP 2: "  + newValue + ", scene: " + knobScene);
                navKnobButtons[knobScene][1].mSurfaceValue.setProcessValue(context, 127)
            } else {
                console.log("DOWN 3: " + newValue + ", scene: " + knobScene);
                navKnobButtons[knobScene][0].mSurfaceValue.setProcessValue(context, 127)
            }
            lastNavKnobValue = newValue;
        }

        knob.mSurfaceValue.mMidiBinding
            .setInputPort(midiInput)
            .setOutputPort(midiOutput)
            .bindToControlChange(0, 49);

        hostMapper.mapNavigationKnobButtons(navKnobButtons);
    }

    this.initFaders = function() {
        var selectButtonsMidi = [
            {channel: 1, code: 64},
            {channel: 1, code: 66},
            {channel: 1, code: 67},
            {channel: 1, code: 65},
            {channel: 1, code: 68},
            {channel: 1, code: 80},
            {channel: 1, code: 81},
            {channel: 1, code: 123},
           
        ];
        
        var fadersMidi = [1, 11, 7, 10, 5, 84, 2, 16];
        var faders = [];
        
        for(var i = 0; i < numBankItems; i++) {
        
            var selectButton = deviceDriver.mSurface.makeButton(i * 2 + 2, 0, 2, 1)
            selectButton.mSurfaceValue.mMidiBinding
                .setInputPort(midiInput)
                .setOutputPort(midiOutput)
                .bindToControlChange (selectButtonsMidi[i].channel, selectButtonsMidi[i].code);
            hostMapper.mapSelectButton(selectButton, i);
        
            var muteButton = deviceDriver.mSurface.makeButton(i * 2 + 2, 1, 1, 1);
            muteButton.mSurfaceValue.mMidiBinding
                .setInputPort(midiInput)
                .setOutputPort(midiOutput)
                .bindToControlChange(2, 23 + i);
            hostMapper.mapMuteButton(muteButton, i);
    
            var soloButton = deviceDriver.mSurface.makeButton(i * 2 + 3, 1, 1, 1);
            soloButton.mSurfaceValue.mMidiBinding
                .setInputPort(midiInput)
                .setOutputPort(midiOutput)
                .bindToControlChange(3, 23 + i);
            hostMapper.mapSoloButton(soloButton, i);
        
            var fader = deviceDriver.mSurface.makeFader(i * 2 + 0.5 + 2, 2, 1, 6);
        
            fader.mSurfaceValue.mMidiBinding
                .setInputPort(midiInput) //received from device
                // causes fader 3 to overtake fader 1
                // .setOutputPort(midiOutput) //sent to device,
                .bindToControlChange(0, fadersMidi[i]);

            faders.push(fader);
        }
        hostMapper.mapFaders(faders);
    }
    return this;
}

// ---

function HostMapper(device) {
    var pageDefault = device.driver.mMapping.makePage("Main Page");
    var pageEq = device.driver.mMapping.makePage("Channel Page");

    pageDefault.mOnActivate = function (context) {
        console.log('Default Page Activated');
    }
    pageEq.mOnActivate = function (context) {
        console.log('Channel Page Activated');
    }
    var mixerBankZone = pageDefault.mHostAccess.mMixConsole.makeMixerBankZone();
    var selectedMixerChannel = pageEq.mHostAccess.mTrackSelection.mMixerChannel;
    
    var mainChannel = mixerBankZone.makeMixerBankChannel();

    var channels = [];

    for (var i = 0 ; i < 8 ; i++) {
        channels.push(mixerBankZone.makeMixerBankChannel());
    }
    this.pageDefault = pageDefault;
    this.pageEq = pageEq;

    this.mapPluginsButton = function(button) {
        pageDefault.makeActionBinding(button.mSurfaceValue, device.driver.mAction.mNextPage);
        pageEq.makeActionBinding(button.mSurfaceValue, device.driver.mAction.mPrevPage);
    }

    this.mapPanKnob = function(panKnob) {
        this.pageDefault.makeValueBinding (panKnob.mSurfaceValue, pageDefault.mHostAccess.mTrackSelection.mMixerChannel.mValue.mPan) ;
    }

    this.mapNavigationKnobButtons = function(navKnobButtons){
        pageDefault.makeActionBinding(navKnobButtons[0][0].mSurfaceValue, pageDefault.mHostAccess.mTrackSelection.mAction.mPrevTrack);
        pageDefault.makeActionBinding(navKnobButtons[0][1].mSurfaceValue, pageDefault.mHostAccess.mTrackSelection.mAction.mNextTrack);
        
        pageDefault.makeCommandBinding(navKnobButtons[1][1].mSurfaceValue, 'Zoom', 'Zoom In');
        pageDefault.makeCommandBinding(navKnobButtons[1][0].mSurfaceValue, 'Zoom', 'Zoom Out');
    
        pageDefault.makeCommandBinding(navKnobButtons[2][1].mSurfaceValue, 'Transport', 'Nudge Cursor Right');
        pageDefault.makeCommandBinding(navKnobButtons[2][0].mSurfaceValue, 'Transport', 'Nudge Cursor Left');
    
        pageDefault.makeCommandBinding(navKnobButtons[3][1].mSurfaceValue, 'Navigate', 'Right');
        pageDefault.makeCommandBinding(navKnobButtons[3][0].mSurfaceValue, 'Navigate', 'Left');

    }

    this.mapFaders = function(faders) {
        for (var i = 0 ; i < faders.length ; i++) {
            this.mapFader(faders[i], i);
        }
    };

    this.mapFader = function(fader, channelIndex) {
        this.pageDefault.makeValueBinding (fader.mSurfaceValue, channels[channelIndex].mValue.mVolume) ;
            
        // from host to device
        (function (channelNumber) {
            channels[channelNumber].mValue.mVolume.mOnProcessValueChange = function (a, b, newValue) {
                device.midiOutput.sendMidi(a,  [176 + channelNumber, 7, parseInt(newValue * 127)]);
            }
        })(channelIndex);


        
        switch (channelIndex) {
            case 0:
                this.pageEq.makeValueBinding (fader.mSurfaceValue, selectedMixerChannel.mChannelEQ.mBand1.mGain);

                selectedMixerChannel.mChannelEQ.mBand1.mGain.mOnProcessValueChange = function (a, b, newValue) {
                    device.midiOutput.sendMidi(a,   [176 + channelIndex, 7, parseInt(newValue * 127)]);
                }
                break;
            case 1:
                this.pageEq.makeValueBinding (fader.mSurfaceValue, selectedMixerChannel.mChannelEQ.mBand2.mGain);

                selectedMixerChannel.mChannelEQ.mBand2.mGain.mOnProcessValueChange = function (a, b, newValue) {
                    device.midiOutput.sendMidi(a,   [176 + channelIndex, 7, parseInt(newValue * 127)]);
                }
                break;
            case 2:
                this.pageEq.makeValueBinding (fader.mSurfaceValue, selectedMixerChannel.mChannelEQ.mBand3.mGain);

                selectedMixerChannel.mChannelEQ.mBand3.mGain.mOnProcessValueChange = function (a, b, newValue) {
                    device.midiOutput.sendMidi(a,   [176 + channelIndex, 7, parseInt(newValue * 127)]);
                }
                break;
            case 3:
                this.pageEq.makeValueBinding (fader.mSurfaceValue, selectedMixerChannel.mChannelEQ.mBand4.mGain);

                selectedMixerChannel.mChannelEQ.mBand4.mGain.mOnProcessValueChange = function (a, b, newValue) {
                    device.midiOutput.sendMidi(a,   [176 + channelIndex, 7, parseInt(newValue * 127)]);
                }
                break;
            case 4:
                this.pageEq.makeValueBinding (fader.mSurfaceValue, selectedMixerChannel.mChannelEQ.mBand1.mFreq);

                selectedMixerChannel.mChannelEQ.mBand1.mFreq.mOnProcessValueChange = function (a, b, newValue) {
                    device.midiOutput.sendMidi(a,   [176 + channelIndex, 7, parseInt(newValue * 127)]);
                }
                break;
            case 5:
                this.pageEq.makeValueBinding (fader.mSurfaceValue, selectedMixerChannel.mChannelEQ.mBand2.mFreq);

                selectedMixerChannel.mChannelEQ.mBand2.mFreq.mOnProcessValueChange = function (a, b, newValue) {
                    device.midiOutput.sendMidi(a,   [176 + channelIndex, 7, parseInt(newValue * 127)]);
                }
                break;
            case 6:
                this.pageEq.makeValueBinding (fader.mSurfaceValue, selectedMixerChannel.mChannelEQ.mBand3.mFreq);

                selectedMixerChannel.mChannelEQ.mBand3.mFreq.mOnProcessValueChange = function (a, b, newValue) {
                    device.midiOutput.sendMidi(a,   [176 + channelIndex, 7, parseInt(newValue * 127)]);
                }
                break;
            case 7:
                this.pageEq.makeValueBinding (fader.mSurfaceValue, selectedMixerChannel.mChannelEQ.mBand4.mFreq);

                selectedMixerChannel.mChannelEQ.mBand4.mFreq.mOnProcessValueChange = function (a, b, newValue) {
                    device.midiOutput.sendMidi(a,   [176 + channelIndex, 7, parseInt(newValue * 127)]);
                }
                break;
        }
    };

    this.mapSelectButton = function(button, channelIndex) {
        switch (channelIndex) {
            case 0:
                this.pageEq.makeValueBinding (button.mSurfaceValue, selectedMixerChannel.mChannelEQ.mBand1.mOn);
                break;
            case 1:
                this.pageEq.makeValueBinding (button.mSurfaceValue, selectedMixerChannel.mChannelEQ.mBand2.mOn);
                break;
            case 2:
                this.pageEq.makeValueBinding (button.mSurfaceValue, selectedMixerChannel.mChannelEQ.mBand3.mOn);
                break;
            case 3:
                this.pageEq.makeValueBinding (button.mSurfaceValue, selectedMixerChannel.mChannelEQ.mBand4.mOn);
                break;
        }
        this.pageDefault.makeValueBinding (button.mSurfaceValue, channels[channelIndex].mValue.mSelected);
    };

    this.mapMuteButtons = function(buttons) {
        for(var i = 0 ; i < buttons.length ; i++) {
            this.mapMuteButton (buttons[i], i);
        }
    };

    this.mapMuteButton = function(button, channelIndex) {
        this.pageDefault.makeValueBinding(button.mSurfaceValue, channels[channelIndex].mValue.mMute);
    };

    this.mapSoloButtons = function(buttons) {
        for(var i = 0 ; i < buttons.length ; i++) {
            this.mapSoloButton (buttons[i], i);
        }
    };

    this.mapSoloButton = function(button, channelIndex) {
        this.pageDefault.makeValueBinding(button.mSurfaceValue, channels[channelIndex].mValue.mSolo);
    };

    this.getMainChannel = function() {
        return mainChannel;
    }

    return this;
}