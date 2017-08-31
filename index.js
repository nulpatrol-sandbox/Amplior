#!/usr/bin/env node

const fs = require('fs');
const chalk = require('chalk');
const os = require('os');
const esprima = require('esprima');
const path = require('path');
const nconf = require('nconf');

const lib = require('./lib/file');
const dias = require('./lib/diasHelper');
const utils = require('./lib/utils');
const writeToFile = lib.writeToFile;

nconf.file('diasify.json');
nconf.defaults({
    'assetsDir': 'resources/assets/js/',
    'storeDirName': 'store/',
    'mtFileName': 'mutation-types.js',
});

var assetsDir = nconf.get('assetsDir');
if (typeof nconf.get('module') !== 'undefined') {
    assetsDir = assetsDir + nconf.get('module') + '/';
}

const fullMT = path.normalize(assetsDir + nconf.get('storeDirName') + nconf.get('mtFileName'));
const storePath = path.normalize(assetsDir + nconf.get('storeDirName') + 'modules/');

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

    let aa = utils.parseStructure(moduleStructure);
    dias.extendMutationTypes(fullMT, utils.normalizeFields(aa));
    let code = dias.generate(dias.makeStoreFile(aa, moduleName));
    writeToFile(storePath + moduleName + '.js', code);
    console.log(chalk.green('ADDED ') + chalk.yellow(storePath + moduleName + '.js'));
}


/*
const langDir = assetsDir + 'lang/';

const isDir = source => fs.lstatSync(source).isDirectory();

var command = process.argv[2];
if (command.indexOf(':') !== -1) {
    var segments = command.split(':');
    var module = segments[0];
    var action = segments[1];

    if (module == 'lang') {
        if (action == 'list') {
            fs.readdir(langDir, (err, files) => {
                if (err != null) {
                    console.log(chalk.red('JS Assets not found'));
                    process.exit()
                }

                var langs = [];
                files.forEach(file => {
                    if (isDir(langDir + file)) {
                        langs.push(file);
                    }
                });
                console.log(langs);
            });
        } else if (action == 'add') {
            var pathTo = langDir + process.argv[3];
            if (!fs.existsSync(pathTo)){
                fs.mkdirSync(pathTo);
                writeToFile(pathTo + '/' + process.argv[3] + '.js', ast.makeExportDefault(ast.makeTranslation()));
            } else {
                console.log('already exists');
            }
        } else if (action === 'add-key') {
            var program = esprima.parse(require('fs').readFileSync(langDir + 'uk/uk.js').toString(), {sourceType: 'module'});
            program.body[0].declaration.properties[0].value.properties.push(ast.makeLiteralProperty(process.argv[3], process.argv[4]));
            writeToFile(langDir + 'uk/uk.js', program.body[0]);
        }
    }
}
*/