const utils = require('./utils');
const fs = require('fs');
const path = require('path');
const file = require('./file');

const isDir = source => fs.lstatSync(source).isDirectory();

class Language {
    constructor(languagesPath) {
        this.languagesPath = languagesPath;
        fs.readdir(languagesPath, (err, files) => {
            var langs = [];
            files.forEach(file => {
                if (isDir(languagesPath + file)) {
                    langs.push(file);
                }
            });
        });

        let mainLocalePath = path.normalize(this.languagesPath + '/he/he.js');
        let secondLocalePath = path.normalize(this.languagesPath + '/en/en.js');

        this.languageAst = utils.readAST(mainLocalePath);
        this.languageSecondAst = utils.readAST(secondLocalePath);

        let keys = this.languageAst.body[0].declaration.properties[0].value.properties;
        let secondKeys = this.languageSecondAst.body[0].declaration.properties[0].value.properties;

        for (let i = 0; i < keys.length; i++) {
            if (keys[i].key.name !== secondKeys[i].key.name) {
                secondKeys.splice(i, 0, keys[i]);
            }
        }

        file.writeToFile(secondLocalePath, utils.generate(this.languageSecondAst));
    }

    fix() {

    }
}

module.exports = Language;