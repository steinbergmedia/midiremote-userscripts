<h1>MIDI REMOTE for BEHRINGER BCR2000</h1>

<b>INSTALL:</b> 
- Create folder structure "Behringer/BCR2000" inside "../MIDI Remote/Driver Scripts/Local" folder.
- Copy .js file inside BCR2000 folder.
- Connect your device.
- Start Cubase/Nuendo.

<b>IMPORTANT:</b>
factory preset for BCR2000 is absolute mode, and this cause stutter moving on knobs: I used relative mode. 
BCR2000 need to be configured manually prior to use this script:
- all knobs need to be in “rel1” mode;
- all buttons “toggle off” mode.

Or you can load attached .bcr preset (easy done with BC MANAGER https://mountainutilities.eu/bcmanager).

This is the default CC assignement to match midi remote script:
![Immagine1](https://user-images.githubusercontent.com/101831235/159006077-9ba786d6-dd70-4328-be39-a26210b7813b.png)

<h2>FOCUS PAGE</h2>

![Focus page](https://user-images.githubusercontent.com/101831235/159119444-0d218338-423c-4c4d-963d-b3a0183a04fc.png)

Use Encoder Groups buttons on BCR2000 to switch between 
- Sends 
- Focused Quick Controls
- Track Quick Controls
- Cues

EQ Q/TYPE button, switches between Q and filter type on lower knobs

Side buttons:
use arrows buttons to move between tracks
use page button to switch page

<h2>MIXING PAGE</h2>

![02](https://user-images.githubusercontent.com/101831235/159119463-9793dedd-06c1-4c50-b40a-d82e10955b9d.png)

Side buttons:
use arrows to switch banks

 
<h3>Changelog:</h3>

- v 1.0 07/03/2022
first release.
- v 1.1 08/03/2022
navigate tracks via side button.
- v 1.2 09/03/2022
Focused Quick Control lock added.
- v 1.3 10/03/2022
Pre-filter eq controls added.
Added push button for Focused Quick Control: if focused parameter is a button now you can push the encoder to switch. 
- v 1.4.
Added Layers for encoders Group.
- v 1.5 11/03/2022
Cue level control added.
Control Room Main channel level control added.
Monitor enable control added.
Read and write automation control added.
Foot-switches added.
- v 1.6 19/03/2022
Added label for focused track and selected page.
Focus Control page: Phase control added, EQ Q/TYPE button added to switch between Q and filter type on lower knobs. Mixing page added to control banks of 8 channels at once. Mixing page shows track names.



Programmed by Giampaolo Gesuale
contact: giampaologesuale@gmail.com
