#!/usr/bin/env node

const fs = require('fs');
const chalk = require('chalk');
const os = require('os');
const esprima = require('esprima');
const path = require('path');
const nconf = require('nconf');

const lib = require('./lib/file');
const dias = require('./lib/diasHelper');
const mixin = require('./lib/mixinHelper');
const utils = require('./lib/utils');
const writeToFile = lib.writeToFile;

nconf.file('diasify.json');
nconf.defaults({
    'assetsDir': 'resources/assets/js/',
    'storeDirName': 'store/',
    'mixinsDirName': 'mixins/',
    'mtFileName': 'mutation-types.js',
});

var assetsDir = nconf.get('assetsDir');
if (typeof nconf.get('module') !== 'undefined') {
    assetsDir = assetsDir + nconf.get('module') + '/';
}

const fullMT = path.normalize(assetsDir + nconf.get('storeDirName') + nconf.get('mtFileName'));
const storePath = path.normalize(assetsDir + nconf.get('storeDirName') + 'modules/');
const mixinsPath = path.normalize(assetsDir + nconf.get('mixinsDirName'));

var command = process.argv[2];
if (command == 'store') {
    var moduleName = process.argv[3];
    var moduleStructure = process.argv[4];
    if (typeof moduleName === 'undefined') {
        console.log(chalk.red('Please specify module name.'));
        process.exit();
    }
    if (typeof moduleStructure === 'undefined') {
        console.log(chalk.red('Please specify module structure.'));
        process.exit();
    }

    let stateFields = utils.parseStructure(moduleStructure);
    let storeFilename = storePath + moduleName + '.js';
    let mixinFilename = mixinsPath + moduleName + 'Mixin.js';

    dias.extendMutationTypes(fullMT, utils.normalizeFields(stateFields));
    dias.addStoreFile(stateFields, moduleName, storeFilename);
    dias.addMixinFile(utils.normalizeFields(stateFields), mixinFilename);
}
