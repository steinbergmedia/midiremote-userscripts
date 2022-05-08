var sw_rev = '1.03'

//-----------------------------------------------------------------------------
// 0. INCLUDE common functions
//-----------------------------------------------------------------------------

var mackieSurface = require('./mackie_c4_surface.js');
var MackieC4 = mackieSurface.MackieC4;

var mackiePageEqMix = require('./mackie_c4_page_eqmix.js');
var makeEqMixPage = mackiePageEqMix.makeEqMixPage;

//-----------------------------------------------------------------------------
// 1. DRIVER SETUP - create driver object, midi ports and detection information
//-----------------------------------------------------------------------------

var midiremote_api = require('midiremote_api_v1')
var deviceDriver = midiremote_api.makeDeviceDriver('mackie', 'c4', 'Ron Garrison')

//----------------------------------------------------------------------------------------------------------------------
// 2. SURFACE LAYOUT - create control elements and midi bindings
//----------------------------------------------------------------------------------------------------------------------

var mackieC4 = new MackieC4(deviceDriver, sw_rev);

//----------------------------------------------------------------------------------------------------------------------
// 3. HOST MAPPING - create mapping pages and host bindings
//----------------------------------------------------------------------------------------------------------------------

// Equalizer Mix Page

var eqMixPage = makeEqMixPage(deviceDriver, mackieC4);

eqMixPage.mOnActivate = function(context) {
  //mackieC4.clearAll(context)
  mackieC4.setLedStripText(1, 0, 'Band 1 ---------------Frequncy (Hz)---------------------');
  //mackieC4.setLedStripText(1, 0, 'EQ1--------------------Gain (dB)------------------------');
  mackieC4.setLedStripText(2, 0, 'Band 1 ----------------Q Factor-------------------------');
  mackieC4.setLedStripText(3, 0, 'Band 1 --------Filter Type-(Push=on/off)----------------');
  mackieC4.setLedStrip(context, 1, 0);
  mackieC4.setLedStrip(context, 2, 0);
  mackieC4.setLedStrip(context, 3, 0);    
}

