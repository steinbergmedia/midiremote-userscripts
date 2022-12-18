function setTextOfColumn(columnIndex, col_text, original_text) {
    var col = columnIndex * 7
    var text = (col_text + '       ').slice(0, 7) // ensure to always clear a column

    //  original_text must be the full width of the display when setting a column
    // so pad with spaces if it isn't
    var new_text = original_text.slice(0, 56)
    var length = new_text.length
    while (length++ < 56)
        new_text = new_text.concat(" ")

    new_text = new_text.substring(0, col) + text + new_text.substring(col + 7, new_text.length);

    return new_text
}

function setTextOfLine(textString) {
    var blank = Array(56).join(" ")
    var text = (textString + blank).slice(0, 56) // ensure to always clear the entire row

    return text
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
    display: {
        // reset: resetDisplay,
        makeLabel: makeLabel,
        setTextOfColumn: setTextOfColumn,
        setTextOfLine: setTextOfLine
    }
}
