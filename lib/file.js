'use strict'

const fs = require('fs');
const escodegen = require('escodegen');

exports.writeToFile = function writeToFile(path, code) {
    var file = fs.createWriteStream(path);
    file.on('error', function(err) {
        console.log(err);
    });

    file.write(code);
    file.end();
}