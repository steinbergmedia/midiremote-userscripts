function makeEqMixPage(deviceDriver, mackieC4) {
    function printTrackTitles(button, ch) {
  
      var trackTitle = mackieC4.surface.makeCustomValueVariable('trackTitle');
  
      trackTitle.mOnTitleChange = function(context, objectTitle, valueTitle) {
        var text = "      |";
        if (objectTitle.length < 7) {
          text = text.replace(text.substring(0, objectTitle.length), objectTitle.substring(0, objectTitle.length));
        } else {
          text = text.replace(text.substring(0, 4), objectTitle.substring(0, 4));
          text = text.replace(text.substring(4, 6), objectTitle.substring(objectTitle.length-2, objectTitle.length));
        }
        button.setLabelText(context, 0, text);
        // console.log("Print Track Title".concat(button.row.toString(), button.column.toString(),  text));
      }
  
      page.makeValueBinding(trackTitle, ch);
    }
  
  
    console.log("Page EqMix Initialization");
  
  
    this.eqBand = 1;
    this.writeAutomationState = 0;
    this.selectedTrackName = '';
    this.transportRecordState = 0;
  
    var page = deviceDriver.mMapping.makePage('EQ Mixer Mode')
    //page.setLabelFieldText(mackieC4.pagename, 'EQ Mixer Mode')
    
    
    var hostMixerBankZone = page.mHostAccess.mMixConsole.makeMixerBankZone()
    .excludeInputChannels()
    .excludeOutputChannels()
    
    var EqSubPageArea = page.makeSubPageArea('EQ area');
    var subPageEQ1 = EqSubPageArea.makeSubPage('EQ 1');
    var subPageEQ2 = EqSubPageArea.makeSubPage('EQ 2');
    var subPageEQ3 = EqSubPageArea.makeSubPage('EQ 3');
    var subPageEQ4 = EqSubPageArea.makeSubPage('EQ 4');
    
    var channelBankItem = new Array(8);
    for (var i = 0; i < 8; ++i) {
      // Host Mapping
      channelBankItem[i] = hostMixerBankZone.makeMixerBankChannel()
      var knobRow0 = mackieC4.pushEncoder[0];
      var knobRow1 = mackieC4.pushEncoder[1];
      var knobRow2 = mackieC4.pushEncoder[2];
      var knobRow3 = mackieC4.pushEncoder[3];
      // EQ 1
      page.makeValueBinding(knobRow3[i].pushEncoder.mPushValue,    channelBankItem[i].mChannelEQ.mBand1.mOn).setSubPage(subPageEQ1).setTypeToggle();
      page.makeValueBinding(knobRow0[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand1.mGain).setSubPage(subPageEQ1);
      page.makeValueBinding(knobRow1[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand1.mFreq).setSubPage(subPageEQ1);
      page.makeValueBinding(knobRow2[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand1.mQ).setSubPage(subPageEQ1);
      page.makeValueBinding(knobRow3[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand1.mFilterType).setSubPage(subPageEQ1);
      // EQ 2[i]
      page.makeValueBinding(knobRow3[i].pushEncoder.mPushValue,    channelBankItem[i].mChannelEQ.mBand2.mOn).setSubPage(subPageEQ2).setTypeToggle();
      page.makeValueBinding(knobRow0[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand2.mGain).setSubPage(subPageEQ2);
      page.makeValueBinding(knobRow1[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand2.mFreq).setSubPage(subPageEQ2);
      page.makeValueBinding(knobRow2[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand2.mQ).setSubPage(subPageEQ2);
      page.makeValueBinding(knobRow3[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand2.mFilterType).setSubPage(subPageEQ2);
      // EQ 3
      page.makeValueBinding(knobRow3[i].pushEncoder.mPushValue,    channelBankItem[i].mChannelEQ.mBand3.mOn).setSubPage(subPageEQ3).setTypeToggle();
      page.makeValueBinding(knobRow0[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand3.mGain).setSubPage(subPageEQ3);
      page.makeValueBinding(knobRow1[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand3.mFreq).setSubPage(subPageEQ3);
      page.makeValueBinding(knobRow2[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand3.mQ).setSubPage(subPageEQ3);
      page.makeValueBinding(knobRow3[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand3.mFilterType).setSubPage(subPageEQ3);
      // EQ 4
      page.makeValueBinding(knobRow3[i].pushEncoder.mPushValue,    channelBankItem[i].mChannelEQ.mBand4.mOn).setSubPage(subPageEQ4).setTypeToggle();
      page.makeValueBinding(knobRow0[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand4.mGain).setSubPage(subPageEQ4);
      page.makeValueBinding(knobRow1[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand4.mFreq).setSubPage(subPageEQ4);
      page.makeValueBinding(knobRow2[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand4.mQ).setSubPage(subPageEQ4);
      page.makeValueBinding(knobRow3[i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand4.mFilterType).setSubPage(subPageEQ4);
    
  
      printTrackTitles(knobRow0[i], channelBankItem[i].mValue.mVolume);
  
    }
    
    function sendFeedbackOut(context, button, ch) {
      
      button.pushEncoder.mEncoderValue.mOnProcessValueChange = function (context, newValue) {
        var r = button.row.toString();
        var c = button.column.toString();
        var normalized = Math.round(newValue*126.99).toString()
        // console.log("Encoder ProcessValueChange(".concat(r, ",", c, ") = ", newValue.toString(), ",  ",  normalized))
        var text = ''
        switch (button.row) {
          case 0:
            // Use VPotLedMode 1 for Gain
            button.setVPotLedMode(1)
            // Calculate Gain
            text = ((Math.round(newValue*480)/10)-24).toFixed(1);
            //  console.log(text)
            break;
          case 1:
            break;
          case 2:
            // Calculate Q Factor
            text = (Math.round(newValue*120)/10).toFixed(1);
            break;
          case 3:
            // Determine Filter Type
            switch (this.eqPage) {
              case 1:
                if      (newValue < 0.1428571492433548) {text = 'P I   |'} 
                else if (newValue < 0.2857142984867096) {text = 'LS I  |'} 
                else if (newValue < 0.4285714328289032) {text = 'HP I  |'} 
                else if (newValue < 0.5714285969734192) {text = 'HP II |'} 
                else if (newValue < 0.7142857313156128) {text = 'P II  |'} 
                else if (newValue < 0.8571428656578064) {text = 'LS II |'} 
                else if (newValue < 1)                  {text = 'LS III|'} 
                else                                    {text = 'LS IV |'} 
                break;
              case 2:
              case 3:
                if      (newValue == 0) {text = 'P I   |'} 
                else                    {text = 'P II  |'}
                break;
              case 4:
                if      (newValue < 0.1428571492433548) {text = 'P I   |'} 
                else if (newValue < 0.2857142984867096) {text = 'HS I  |'} 
                else if (newValue < 0.4285714328289032) {text = 'LP I  |'} 
                else if (newValue < 0.5714285969734192) {text = 'LP II |'} 
                else if (newValue < 0.7142857313156128) {text = 'P II  |'} 
                else if (newValue < 0.8571428656578064) {text = 'HS II |'} 
                else if (newValue < 1)                  {text = 'HS III|'} 
                else                                    {text = 'HS IV |'} 
                break;
            }
            break;
        }
        button.setVPotLed(newValue)
        button.sendVPotLedMidi(context);
       }  
  
       // button.pushEncoder.mPushValue.mOnProcessValueChange = function (context, value) {
       //  var r = button.row.toString();
       //  var c = button.column.toString();
       //  // console.log("Push ProcessValueChange(".concat(r, ",", c, ") = ", value.toString()))
       //   switch (button.row) {
       //     case 0: break;
       //     case 1: break;
       //     case 2: break;
       //     case 3: button.setVPotCenterLed(value); break;
       //   }
       //   button.setVPotLed(value)
       //   button.sendVPotLedMidi(context);
       // }
    
       button.pushEncoder.mPushValue.mOnProcessValueChange = function (context, value) {
         switch (button.row) {
           case 0: break;
           case 1: break;
           case 2: break;
           case 3: button.setVPotCenterLed(value); break;
         }
         button.sendVPotLedMidi(context);
       }
    // 
      button.pushEncoder.mEncoderValue.mOnDisplayValueChange = function (context, displayText, str2) {
        var r = button.row.toString();
        var c = button.column.toString();
        // console.log("DisplayValueChange(".concat(r, ",", c, ") - ", displayText))
    
        var text = "      |"
        switch (button.row) {
          case 0:
            // gain
            // Strip off dB at the end
            text = text.replace(text.substring(0, displayText.length-2), displayText.substring(0, displayText.length-2));
            break;
          case 1:
            // Frequency
            // Strip Hz off the end
            text = text.replace(text.substring(0, displayText.length-2), displayText.substring(0, displayText.length-2));
           break;
          case 2:
              // Q Factor
            text = text.replace(text.substring(0, displayText.length), displayText.substring(0, displayText.length));
            break;
          case 3:
            // Filter Type - Encode into 6 chars
            switch (displayText) {
              case 'Parametric I':   text = "P I   |"; break;
              case 'Parametric II':  text = "P II  |"; break;
              case 'Low Shelf I':    text = "LS I  |"; break;
              case 'Low Shelf II':   text = "LS II |"; break;
              case 'Low Shelf III':  text = "LS III|"; break;
              case 'Low Shelf IV':   text = "LS IV |"; break;
              case 'High Pass I':    text = "HP I  |"; break;
              case 'High Pass II':   text = "HP II |"; break;
              case 'High Shelf I':   text = "HS I  |"; break;
              case 'High Shelf II':  text = "HS II |"; break;
              case 'High Shelf III': text = "HS III|"; break;
              case 'High Shelf IV':  text = "HS IV |"; break;
              case 'Low Pass I':     text = "LP I  |"; break;
              case 'Low Pass II':    text = "LP II |"; break;
            }
            break;
        }
        button.setLabelText(context, 1, text);
      }
    }
    
    // Equallzer Select
    var eqPrevButton = mackieC4.slotDown;
    var eqNextButton = mackieC4.slotUp;
    page.makeActionBinding(eqPrevButton.button.mSurfaceValue, EqSubPageArea.mAction.mPrev);
    page.makeActionBinding(eqNextButton.button.mSurfaceValue, EqSubPageArea.mAction.mNext);
    
    page.setLabelFieldText(mackieC4.pushEncoderLabelTop[0], "Equalizer Mixer Page");
  
  
    subPageEQ1.mOnActivate = function(activeDevice) {
      this.eqBand = 1;
      mackieC4.pushEncoder[1][0].setLabelText(activeDevice, 0, "Band 1 ");
      mackieC4.pushEncoder[2][0].setLabelText(activeDevice, 0, "Band 1 ");
      mackieC4.pushEncoder[3][0].setLabelText(activeDevice, 0, "Band 1 ");
    
      // the EQ Type sub page has been activated, turn EQ Type LED on
      console.log('EQ1 Subpage Activated');
      for (var i = 0; i < 8; i++) {
        //page.makeValueBinding(mackieC4.pushEncoder[0][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand1.mFreq).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
        //page.makeValueBinding(mackieC4.pushEncoder[1][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand1.mGain).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
        //page.makeValueBinding(mackieC4.pushEncoder[2][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand1.mQ).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
        //page.makeValueBinding(mackieC4.pushEncoder[3][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand1.mFilterType).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
    //
        // Frequency
        sendFeedbackOut(activeDevice, mackieC4.pushEncoder[0][i], channelBankItem[i].mValue.mVolume);
        // Gain
        sendFeedbackOut(activeDevice, mackieC4.pushEncoder[1][i], channelBankItem[i].mValue.mVolume);
        // Q-factor
        sendFeedbackOut(activeDevice, mackieC4.pushEncoder[2][i], channelBankItem[i].mValue.mVolume);
        // Filter Type
        sendFeedbackOut(activeDevice, mackieC4.pushEncoder[3][i], channelBankItem[i].mValue.mVolume);
      }  
    }
     
    subPageEQ2.mOnActivate = function(activeDevice) {
      this.eqBand = 2;
      mackieC4.pushEncoder[1][0].setLabelText(activeDevice, 0, "Band 2 ");
      mackieC4.pushEncoder[2][0].setLabelText(activeDevice, 0, "Band 2 ");
      mackieC4.pushEncoder[3][0].setLabelText(activeDevice, 0, "Band 2 ");
      // the EQ Type sub page has been activated, turn EQ Type LED on
      console.log('EQ2 Subpage Activated');
      for (var i = 0; i < 8; i++) {
        //page.makeValueBinding(mackieC4.pushEncoder[0][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand2.mFreq).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
        //page.makeValueBinding(mackieC4.pushEncoder[1][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand2.mGain).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
        //page.makeValueBinding(mackieC4.pushEncoder[2][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand2.mQ).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
        //page.makeValueBinding(mackieC4.pushEncoder[3][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand2.mFilterType).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
    
        // Frequency
        sendFeedbackOut(activeDevice, mackieC4.pushEncoder[0][i], channelBankItem[i].mValue.mVolume);
        // Gain
        sendFeedbackOut(activeDevice, mackieC4.pushEncoder[1][i], channelBankItem[i].mValue.mVolume);
        // Q-factor
        sendFeedbackOut(activeDevice, mackieC4.pushEncoder[2][i], channelBankItem[i].mValue.mVolume);
        // Filter Type
        sendFeedbackOut(activeDevice, mackieC4.pushEncoder[3][i], channelBankItem[i].mValue.mVolume);
      }  
    }
     
    subPageEQ3.mOnActivate = function(activeDevice) {
      this.eqBand = 3;
      mackieC4.pushEncoder[1][0].setLabelText(activeDevice, 0, "Band 3 ");
      mackieC4.pushEncoder[2][0].setLabelText(activeDevice, 0, "Band 3 ");
      mackieC4.pushEncoder[3][0].setLabelText(activeDevice, 0, "Band 3 ");
      // the EQ Type sub page has been activated, turn EQ Type LED on
      console.log('EQ3 Subpage Activated');
      for (var i = 0; i < 8; i++) {
        //page.makeValueBinding(mackieC4.pushEncoder[0][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand3.mFreq).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
        //page.makeValueBinding(mackieC4.pushEncoder[1][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand3.mGain).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
        //page.makeValueBinding(mackieC4.pushEncoder[2][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand3.mQ).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
        //page.makeValueBinding(mackieC4.pushEncoder[3][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand3.mFilterType).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
    
        // Frequency
        sendFeedbackOut(activeDevice, mackieC4.pushEncoder[0][i], channelBankItem[i].mValue.mVolume);
        // Gain
        sendFeedbackOut(activeDevice, mackieC4.pushEncoder[1][i], channelBankItem[i].mValue.mVolume);
        // Q-factor
        sendFeedbackOut(activeDevice, mackieC4.pushEncoder[2][i], channelBankItem[i].mValue.mVolume);
        // Filter Type
        sendFeedbackOut(activeDevice, mackieC4.pushEncoder[3][i], channelBankItem[i].mValue.mVolume);
      }  
    }
     
    subPageEQ4.mOnActivate = function(activeDevice) {
      this.eqBand = 4;
      mackieC4.pushEncoder[1][0].setLabelText(activeDevice, 0, "Band 4 ");
      mackieC4.pushEncoder[2][0].setLabelText(activeDevice, 0, "Band 4 ");
      mackieC4.pushEncoder[3][0].setLabelText(activeDevice, 0, "Band 4 ");
      // the EQ Type sub page has been activated, turn EQ Type LED on
      console.log('EQ4 Subpage Activated');
      for (var i = 0; i < 8; i++) {
        //page.makeValueBinding(mackieC4.pushEncoder[0][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand4.mFreq).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
        //page.makeValueBinding(mackieC4.pushEncoder[1][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand4.mGain).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
        //page.makeValueBinding(mackieC4.pushEncoder[2][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand4.mQ).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
        //page.makeValueBinding(mackieC4.pushEncoder[3][i].pushEncoder.mEncoderValue, channelBankItem[i].mChannelEQ.mBand4.mFilterType).mOnValueChange = function(activeDevice, activeMapping, value, diffValue) {}
     
        // Frequency
        sendFeedbackOut(activeDevice, mackieC4.pushEncoder[0][i], channelBankItem[i].mValue.mVolume);
        // Gain
        sendFeedbackOut(activeDevice, mackieC4.pushEncoder[1][i], channelBankItem[i].mValue.mVolume);
        // Q-factor
        sendFeedbackOut(activeDevice, mackieC4.pushEncoder[2][i], channelBankItem[i].mValue.mVolume);
        // Filter Type
        sendFeedbackOut(activeDevice, mackieC4.pushEncoder[3][i], channelBankItem[i].mValue.mVolume);
      }  
    }
     

    // Shift by bank
    var prevBank = mackieC4.bankLeft;
    var nextBank = mackieC4.bankRight;
    
    // Instead of this:
    // page.makeActionBinding(prevBank.button.mSurfaceValue,  hostMixerBankZone.mAction.mPrevBank);
    // page.makeActionBinding(nextBank.button.mSurfaceValue,  hostMixerBankZone.mAction.mNextBank);
    
    // Do this:
    // Create Custom Value Variable
    var prevBankSelect = mackieC4.surface.makeCustomValueVariable('prevBankSelect');
    var nextBankSelect = mackieC4.surface.makeCustomValueVariable('nextBankSelect');
    
    prevBank.button.mSurfaceValue.mOnProcessValueChange = function (activeDevice, value) {
      
      if (value == 1) {
        // Clear LEDs prior to shifting
        // Clearing only needed on next
        // mackieC4.clearVPotLeds(activeDevice);
    
        // Only send on press, not release
        prevBankSelect.setProcessValue(activeDevice, 1);
      }
    }
    
    nextBank.button.mSurfaceValue.mOnProcessValueChange = function (activeDevice, value) {
      if (value == 1) {
        mackieC4.clearVPotLeds(activeDevice);
     
        // Only send on press, not release
        nextBankSelect.setProcessValue(activeDevice, 1);
      }
    }
    
    // Now bind to the custom Value Variable instead of the button
    page.makeActionBinding(prevBankSelect, hostMixerBankZone.mAction.mPrevBank)
    page.makeActionBinding(nextBankSelect, hostMixerBankZone.mAction.mNextBank)
    
    
    
    
    // Shift by track
    var shiftLeft = mackieC4.singleLeft;
    var shiftRight = mackieC4.singleRight;
    //  page.makeActionBinding(shiftLeft.button.mSurfaceValue,  hostMixerBankZone.mAction.mShiftLeft);
    //  page.makeActionBinding(shiftRight.button.mSurfaceValue,  hostMixerBankZone.mAction.mShiftRight);
    
    var prevChannel = mackieC4.surface.makeCustomValueVariable('prevChannel');
    var nextChannel = mackieC4.surface.makeCustomValueVariable('nextChannel');
    
    shiftLeft.button.mSurfaceValue.mOnProcessValueChange = function (activeDevice, value) {
      if (value == 1) {
        // Clear LEDs prior to shifting
        // Clearing only needed on next
        // mackieC4.clearVPotLeds(activeDevice);
    
        // Only send on press, not release
        prevChannel.setProcessValue(activeDevice, 1);
      }
    }
    
    shiftRight.button.mSurfaceValue.mOnProcessValueChange = function (activeDevice, value) {
      if (value == 1) {
        // Clear LEDs prior to shifting
        mackieC4.clearVPotLeds(activeDevice);
    
        // Only send on press, not release
        nextChannel.setProcessValue(activeDevice, 1);
      }
    }
    
    // Now bind to the custom Value Variable instead of the button
    page.makeActionBinding(prevChannel, hostMixerBankZone.mAction.mShiftLeft)
    page.makeActionBinding(nextChannel, hostMixerBankZone.mAction.mShiftRight)
  
  
  
  
    // Write Automation Test for UMan
    // this.chanStrip
    // this.func
  
    // Write Automation Test for UMan
      // var selectedTrackChannel = page.mHostAccess.mTrackSelection.mMixerChannel
    // 
    // var self = this;
    // selectedTrackChannel.mValue.mAutomationWrite.mOnTitleChange = function (context, mapping, text1, text2) {
    //   self.selectedTrackName = text1
    //   console.log(text1)
    //   console.log(text2)
    // }
    // 
    // // Set the state of the selected track's Write Automation State
    // var self = this;
    // selectedTrackChannel.mValue.mAutomationWrite.mOnDisplayValueChange = function (context, mapping, text1, text2) {
    //   switch (text1) {
    //     case 'Off': self.writeAutomationState = 0; break;
    //     case 'On':  self.writeAutomationState = 1; break;
    //   }
    //  console.log(text1)
    //  console.log(text2)
    //  if (self.writeAutomationState == 0) {
    //   writeAutomation.setLedOff(context)
    //  } else if (self.transportRecordState == 0) {
    //    writeAutomation.setLedOn(context)
    //  } else {
    //    writeAutomation.setLedFlashing(context)
    //  }
    // 
    // }
    // 
    // var self = this;
    // var writeAutomation = mackieC4.spotErase;
    // var writeAutomationCvv = mackieC4.surface.makeCustomValueVariable('writeAutomationCvv');
      // page.makeValueBinding(writeAutomationCvv, selectedTrackChannel.mValue.mAutomationWrite).setTypeToggle() // Spot Erase button || .setValueTakeOverModeScaled()
    // writeAutomation.button.mSurfaceValue.mOnProcessValueChange = function (context, newValue) {
    //   console.log('writeAutomationProcess_value')
    //   if (newValue == 1) {
    //     self.writeAutomationState = 1 - self.writeAutomationState;
    //     writeAutomationCvv.setProcessValue(context, self.writeAutomationState);
    //     console.log(self.writeAutomationState.toString())
    //   }
    // 
    //   if (self.writeAutomationState == 0) {
    //     writeAutomation.setLedOff(context)
    //   } else if (self.transportRecordState == 0) {
    //     writeAutomation.setLedOn(context)
    //   } else {
    //     writeAutomation.setLedFlashing(context)
    //   }
      // }
    // 
    // var self = this;
    // var transportRecord = mackieC4.chanStrip;
      // page.makeValueBinding(transportRecord.button.mSurfaceValue, page.mHostAccess.mTransport.mValue.mRecord).setTypeToggle() // Spot Erase button || .setValueTakeOverModeScaled()
    // transportRecord.button.mSurfaceValue.mOnProcessValueChange = function (context, newValue) {
    //   console.log('transportRecordProcess_value')
    //   self.transportRecordState = newValue;
    //   console.log(self.transportRecordState.toString())
    //   if (self.writeAutomationState == 0) {
    //     writeAutomation.setLedOff(context)
    //   } else if (self.transportRecordState == 0) {
    //     writeAutomation.setLedOn(context)
    //   } else {
    //     writeAutomation.setLedFlashing(context)
    //   }
      // }
    // 
    // var transportStop = mackieC4.function;
      // page.makeValueBinding(transportStop.button.mSurfaceValue, page.mHostAccess.mTransport.mValue.mStop).setTypeToggle() // Spot Erase button || .setValueTakeOverModeScaled()
    // transportStop.button.mSurfaceValue.mOnProcessValueChange = function (context, newValue) {
      // }
  
    return page;
  }
  
  module.exports = {
    makeEqMixPage
  }
  