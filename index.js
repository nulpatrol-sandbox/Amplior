#!/usr/bin/env node

const fs = require('fs');
const chalk = require('chalk');
const os = require('os');
const esprima = require('esprima');
const path = require('path');

const lib = require('./lib/file');
const dias = require('./lib/diasHelper');
const mixin = require('./lib/mixinHelper');
const utils = require('./lib/utils');
const writeToFile = lib.writeToFile;
const conf = require('./lib/Config');

var assetsDir = conf.get('assetsDir');
if (typeof conf.get('module') !== 'undefined') {
    assetsDir = assetsDir + conf.get('module') + '/';
}

const fullMT = path.normalize(assetsDir + conf.get('storeDirName') + conf.get('mtFileName'));
const storePath = path.normalize(assetsDir + conf.get('storeDirName'));
const mixinsPath = path.normalize(assetsDir + conf.get('mixinsDirName'));
const routerPath = path.normalize(assetsDir + conf.get('routerDirName') + '/index.js');

const argv = require('yargs').argv;

var command = process.argv[2];
if (argv._.indexOf('route:list') !== -1) {
    dias.routeList(routerPath);
}

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
    dias.addStoreFile(stateFields, moduleName, storePath);
    dias.addMixinFile(utils.normalizeFields(stateFields), mixinFilename);
}
