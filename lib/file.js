'use strict'

const fs = require('fs');
const escodegen = require('escodegen');
const path = require('path');
const utils = require('./utils');

exports.writeToFile = function writeToFile(filename, code) {
    const filePath = path.normalize(process.cwd() + '/' + filename);
    const file = fs.createWriteStream(filePath);
    file.on('error', function(err) {
        console.log(err);
    });

    file.write(code);
    file.end();
};

exports.writeAST = function writeAST (filename, ast) {
    const filePath = path.normalize(process.cwd() + '/' + filename);
    const file = fs.createWriteStream(filePath);
    file.on('error', function(err) {
        console.log(err);
    });
    //file.write(utils.generate(ast));
    file.end();
};