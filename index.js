#!/usr/bin/env node

const path = require('path');

const dias = require('./lib/diasHelper');
const utils = require('./lib/utils');
const conf = require('./lib/Config');

var assetsDir = conf.get('assetsDir');
if (typeof conf.get('module') !== 'undefined') {
    assetsDir = assetsDir + conf.get('module') + '/';
}

const storePath = path.normalize(assetsDir + conf.get('storeDirName'));
const mixinsPath = path.normalize(assetsDir + conf.get('mixinsDirName'));
const routerPath = path.normalize(assetsDir + conf.get('routerDirName') + '/index.js');
const langDirPath = path.normalize(assetsDir + conf.get('langDirName'));

require('yargs')
    .command(['route:list'], 'Show route list', {}, (argv) => {
        dias.routeList(routerPath);
    })
    .command(['store:make <module_name> <module_structure>'], 'Make store', {}, (argv) => {
        let stateFields = utils.parseStructure(argv.module_structure);
        dias.addStoreModule(stateFields, argv.module_name, storePath);
    })
    .command(['lang:fix'], 'Fix lang files', {}, (argv) => {
        dias.fixLanguages(langDirPath);
    })
    .help()
    .demandCommand()
    .argv;
