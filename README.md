# MIDI Remote API - User Scripts

# About

Welcome to the Steinberg **MIDI Remote API**.

This document will guide you through the steps of writing a **MIDI Remote API Script** for a specific MIDI Controller Hardware.

> **NOTE**: Scripts are written in the **[ES5](https://www.w3schools.com/js/js_es5.asp)** version of **JavaScript**

# Basic Concept

> The **MIDI Remote API Script** acts as a mediator between a Hardware Controller and Cubase / Nuendo

<!-- ## Outer View -->

<img src="_docimg/overview_big.svg" />

<!-- ## Inner View

<img src="./img/internal_block_diagram.svg" /> -->

> The **MIDI Remote API Script** emulates the hardware surface. This improves usability and recognizability.

<img src="_docimg/remote_window_real_world_device.png" />

# Script Structure

### The **MIDI Remote API Script** consists of three building blocks
1. Driver Setup
   - create driver object
   - define driver ports to be associated with existing hardware midi ports
   - specify all possible port namings for automatic device detection

2. Surface Layout
    - visualize the hardware's surface elements (e.g. knobs, faders, buttons)
    - bind surface elements to midi messages

3. Host Mapping
   - create mapping pages for each user workflow (e.g. mixing, playing instruments, track navigation)

<div style="height: 0.5rem">&nbsp;</div>

> The following image illustrates that:

<div style="height: 1rem">&nbsp;</div>

<img src="_docimg/script_structure.svg" />


# Getting Started

<!-- > As IDE we recommend _Visual Studio Code_, however any IDE will do.  -->

### To get started please perform these steps:

1. Make sure you have [Visual Studio Code](https://code.visualstudio.com/) installed.

<div class="warning">
We highly recommend using <a href="https://code.visualstudio.com">Visual Studio Code</a> for writing <b>MIDI Remote API Scripts</b>. We provide a <a href="https://jsdoc.app">JSDoc</a> based auto-completion setup. You will not have to look up types and methods in a separate documentation. <a href="https://code.visualstudio.com">Visual Studio Code</a> will help you write scripts intuitively.
</div>

<img src="_docimg/vscode_autocompletion.png" style="width: 90%; margin: 5% !important;"/>

2. Make sure the folder of the [Visual Studio Code](https://code.visualstudio.com/) executable is added to the PATH environment variable.

3. Make sure you have the newest Cubase / Nuendo installed.

4. Start Cubase / Nuendo.

5. Create a project with audio and/or instrument tracks.

6. Open the Remote tab in the lower zone.

<img src="_docimg/project_window_with_overlays.png" style="width: 90%; margin: 0 5% 5% 5% !important;" />

1. Open the **MIDI Remote Driver Scripts** folder.

> <code class="path"><b>Mac:</b> /Users/&lt;Username&gt;/Documents/Steinberg/&lt;Cubase or Nuendo&gt;/MIDI Remote/Driver Scripts</code>

> <code class="path"><b>Windows:</b> C:\Users\\&lt;Username&gt;\Documents\Steinberg\&lt;Cubase or Nuendo&gt;\MIDI Remote\Driver Scripts</code>

<div style="height: 0.1rem">&nbsp;</div>

1. Open a console (win: cmd, mac: terminal) and go to the **MIDI Remote Driver Scripts** folder.

2. Open [Visual Studio Code](https://code.visualstudio.com/) from the command line like this:

> code .

<img src="_docimg/vscode_open_scripts_folder.png" />

10. Create a script file.
   
The **MIDI Remote API Script** file follows the structure:
<code class="path"> &lt;Driver Scripts Folder&gt;/&lt;Local or Public&gt;/&lt;vendor&gt;/&lt;device&gt;/&lt;vendor&gt;_&lt;device&gt;.js</code>

<div class="warning">
<b>WARNING:</b> Always use the folder <b>Local</b> for development, folder <b>Public</b> will be overwritten when starting Cubase / Nuendo.
</div>

Example:
<code class="path"> &lt;Driver&nbsp;Scripts&nbsp;Folder&gt;/Local/Nektar/Impact_LX49Plus/Nektar_Impact_LX49Plus.js</code>

1.   Connect your MIDI hardware controller.

2.   Open script console.

<img src="_docimg/open_script_console.png" style="width: 90% !important; margin: 0 5% 5% 5% !important;" />

> The **Script Console** appears like this:

<img src="_docimg/scripting_console.png" />

> After modifying the script file press the 'Reload Scripts' button.
