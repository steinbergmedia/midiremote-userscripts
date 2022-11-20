
function displaySetTextOfColumn(columnIndex, rowIndex, textString) {
    var data = [0xf0, 0x00, 0x00, 0x66, 0x14, 0x12,
        columnIndex * 7 + rowIndex * 56]

    var text = (textString + '       ').slice(0, 7) // ensure to always clear a column
    // console.log("display:" + text)
    for (var i = 0; i < 7; ++i)
        data.push(text.charCodeAt(i))
    data.push(0xf7)

    return data
}

function displaySetTextOfLine(rowIndex, textString) {
    var data = [0xf0, 0x00, 0x00, 0x66, 0x14, 0x12,
        rowIndex * 56]
    var blank = Array(56).join(" ")
    var text = (textString + blank).slice(0, 56) // ensure to always clear the entire row
    // console.log("display:" + text)
    for (var i = 0; i < 56; ++i)
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

function makeLabel(value, length) {
    // console.log("makeLabel:" + value)
    // Do nothing if the label is already short enough
    if (value.length <= length) {
        return value
    }

    // If to long shorten it by removing vowels and making it CamelCase to remove spaces
    var words = value.split(" ");
    var label = "";

    for (var i = 0, len = words.length; i < len; i++) {

        var currentStr = words[i];

        var tempStr = currentStr

        // convert first letter to upper case and remove all vowels after first letter
        tempStr = tempStr.substr(0, 1).toUpperCase() + tempStr.substr(1).replace(/[aeiou]/gi, '');

        label += tempStr;

    }
    return label.slice(0, length); // Remove vowels and shorten to 6 char label
}

module.exports = {
    sysex: {
        displaySetTextOfColumn: displaySetTextOfColumn,
        displaySetTextOfLine: displaySetTextOfLine
    },
    display: {
        reset: resetDisplay,
        makeLabel: makeLabel
    }
}
