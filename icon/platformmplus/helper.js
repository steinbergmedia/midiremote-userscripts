
function displaySetTextOfColumn(columnIndex, rowIndex, textString) {
    var data = [0xf0, 0x00, 0x00, 0x66, 0x14, 0x12,
        columnIndex * 7 + rowIndex * 56]

    var text = (textString + '       ').slice(0, 7) // ensure to always clear a column
    console.log("display:"+text)
    for (var i = 0; i < 7; ++i)
        data.push(text.charCodeAt(i))
    data.push(0xf7)

    return data
}

function displaySetTextOfLine(rowIndex, textString) {
    var data = [0xf0, 0x00, 0x00, 0x66, 0x14, 0x12,
        rowIndex * 56]
    var blank = Array(56).join(" ")
    var text = (textString + blank).slice(0, 50) // ensure to always clear the entire row
    console.log("display:"+text)
    for (var i = 0; i < 50; ++i)
        data.push(text.charCodeAt(i))
    data.push(0xf7)

    return data
}

/**
 * @param {MR_ActiveDevice} activeDevice
 * @param {MR_DeviceMidiOutput} outPort
 */
function resetDisplay(activeDevice, outPort) {
    for (var i = 0; i < 8; ++i) {
        for (var k = 0; k < 2; ++k) {
            outPort.sendMidi(activeDevice, displaySetTextOfColumn(i, k, "       "))
        }
    }
}

module.exports = {
    sysex: {
        displaySetTextOfColumn: displaySetTextOfColumn,
        displaySetTextOfLine: displaySetTextOfLine
    },
    display: {
        reset: resetDisplay
    }
}
