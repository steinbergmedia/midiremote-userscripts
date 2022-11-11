
function make_Sysex_displayActivateLayoutByIndex(layoutIndex) {
    return [0xf0, 0x00, 0x20, 0x29, 0x02, 0x0a, 0x01,
        0x01, layoutIndex,
        0xf7]
}

function make_Sysex_displayActivateLayoutKnob() {
    return make_Sysex_displayActivateLayoutByIndex(0x01)
}

function make_Sysex_displaySetTextOfColumn(columnIndex, textFieldIndex, textString) {
    var data = [0xf0, 0x00, 0x00, 0x66, 0x14, 0x12,
        columnIndex * 7 + textFieldIndex * 56]
    //0xF0 0x00 0x00 0x66 0x14 0x12 ' + pos + ' ' + text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x00-\x7F]/g, "?").split('').map(x => x.charCodeAt(0)).join(' ') + ' 0xF7

    var text = (textString + '       ').slice(0, 7) // ensure to always clear a column
    for (var i = 0; i < 7; ++i)
        data.push(text.charCodeAt(i))


    //data.push(0)
    data.push(0xf7)

    return data
}

function make_Sysex_setDisplayValueOfColumn(columnIndex, objectIndex, value) {
    // return [0xf0, 0x00, 0x20, 0x29, 0x02, 0x0a, 0x01,
    //    0x02, columnIndex, 0x03, objectIndex, value, 0xf7]
    return [0xf0, 0x00, 0x00, 0x66, 0x14, 0x12,
        columnIndex * 7 + objectIndex * 56, value]
}

/**
 * @param {MR_ActiveDevice} activeDevice
 * @param {MR_DeviceMidiOutput} outPort
 */
function resetDisplay(activeDevice, outPort) {
    outPort.sendMidi(activeDevice, make_Sysex_displayActivateLayoutKnob())
    for (var i = 0; i < 8; ++i) {
        for (var k = 0; k < 2; ++k) {
            outPort.sendMidi(activeDevice, make_Sysex_displaySetTextOfColumn(i, k, "       "))
        }
    }
}

module.exports = {
    sysex: {
        displayActivateLayoutByIndex: make_Sysex_displayActivateLayoutByIndex,
        displayActivateLayoutKnob: make_Sysex_displayActivateLayoutKnob,
        displaySetTextOfColumn: make_Sysex_displaySetTextOfColumn,
        setDisplayValueOfColumn: make_Sysex_setDisplayValueOfColumn,
    },
    display: {
        reset: resetDisplay
    }
}
