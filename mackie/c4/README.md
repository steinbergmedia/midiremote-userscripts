# MIDI Remote for the Mackie C4 (Version 1.02)

This script has been tested on an eLogic Mackie C4 that has version 1.02
firmware installed, and using Cubase Professional 12.0.20 and the E-mu
1x1 midi interface.

It has not been tested on a Mackie C4-Pro but since the protocol is the
same, then other than potential detection issues, it should work.

## Installation

-   Create folder structure \"mackie/c4\" inside \"../MIDI Remote/Driver
    Scripts/Local\" folder.

-   Copy the mackie_c4.js file inside c4 folder.

-   Connect your device.

-   Start Cubase/Nuendo.

Since the midi name will likely be different for other users, the
.expectInputNameEquals and .expectOutputNameEquals were commented out of
the mackie_c4.js script and the user may want to uncomment them and
change for their own interface as seen below:

```
this.deviceDriver.makeDetectionUnit().detectPortPair(this.midiInput,this.midiOutput)

      .expectInputNameEquals(\'E-MU XMidi1X1\')

      .expectOutputNameEquals(\'E-MU XMidi1X1\')
```

As of Cubase version 12.0.10, the script can be added via the \"+\"
button, and MIDI ports can be assigned manually.

When your unit its detected, the serial number and version of the
firmware should print out in the MIDI Remote Script Console.

## Mackie C4 Pages

As of version 1.02, the following pages have been implemented:

-   Equalizer Mixer Mode Page

### Equalizer Mixer Mode Page

This page implements the ability to control the parameters of the four
equalizer bands on each of the mixer channels as pictured in Figure 1.

#### Controls

-   Row 1 Knobs -- Change the frequency in Hz of the selected equalizer
    on the selected channel.

-   Row 2 Knobs -- Change the gain in decibels of the selected equalizer
    on the selected channel.

-   Row 3 Knobs -- Change the Q factor of the selected equalizer on the
    selected channel.

-   Row 3 Knobs -- Change the Q filter type of the selected equalizer on
    the selected channel.

-   Row 3 Buttons -- Toggles the on/off state of the selected equalizer
    on the selected channel.

-   Next Bank – Select the next bank of 8 channels.

-   Previous Bank - Select the previous bank of 8 channels.

-   Next Channel (Single Right) – Shift by one to the next channel.

-   Previous Channel (Single Left) - Shift by one to the previous channel.

-   Next Equalizer Band (Slot Up) – Select the next equalizer band.

-   Previous Equalizer Band (Slot Down) – Select the previous equalizer band.

![](images/media/image1.jpg)

Figure 1 - Mackie C4 Equalizer Mixer Page

## Known Issues:

-   When a value is changed withing Cubase, the LED updates to the
    correct position but the display value on the Mackie C4 does not. It
    the corresponding knob is nudged (one click to the right then left)
    the values will sync up. A fix is being investigated.
-   As of 12.0.20, after the script is refreshed, the first bank change will 
    result in empty display values.  Subsequent bank changes will operate normally.

## Changelog:

-   V 1.00 4/22/2022 -- Initial Release
-   V 1.01 4/26/2022 -- Fixed issue making updates more responsive.
-   V 1.02 5/05/2022 – Fixed startup issue introduced with Cubase 12.0.20

Script written by Ron Garrison

Contact: <ron.garrison@gmail.com>
