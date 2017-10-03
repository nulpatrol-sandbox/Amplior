const decamelize = require('decamelize');
const camelize = require('camelize');
const escodegen = require('escodegen');
const esformatter = require('esformatter');
const fs = require('fs');
const esprima = require('esprima');
const path = require('path');

exports.parseStructure = function parseStructure (moduleStructure) {
    let entries = moduleStructure.split('|');
    let fields = [];
    entries.forEach((entry) => {
        if (entry.indexOf('(') !== -1) {
            fields.push(...this.parseStructureObject(entry));
        } else {
            fields.push(entry);
        }
    });

    return fields;
}

exports.parseStructureObject = function parseStructureObject (structureObject) {
    const regex = /([a-zA-Z]+)\(([a-zA-Z,\s]+)\)/g;
    let m, res = [];

    while ((m = regex.exec(structureObject)) !== null) {
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        let objectName = m[1];
        let objectFields = m[2];
        res.push({ objectName: objectName, fields: objectFields.split(',').map(item => item.trim()) });
    }

    return res;
}

exports.makeMutTypeName = function makeMutTypeName (name) {
    let result = decamelize(name.replace('.', '_')).toUpperCase();
    return result;
}

exports.normalizeVarName = function normalizeVarName (name) {
    return camelize(name.replace('.', '_'));
}

exports.normalizeFields = function normalizeFields (fields) {
    let normalized = [];
    fields.forEach((item) => {
        if (typeof item === 'string') {
            normalized.push(item);
        } else if (typeof item === 'object') {
            normalized.push(...item.fields.map(entry => item.objectName + '.' + entry));
        }
    });

    return normalized;
}

exports.generate = function generate (ast) {
    return esformatter.format(escodegen.generate(ast), {
        indent : {
            value : '    ',
        },
        lineBreak: {
            before: {
                "VariableDeclaration": ">1",
                "ExportDefaultDeclaration": ">1",
            },
        }
    });
}

exports.readAST = function readAST (filename) {
    var filePath = path.normalize(process.cwd() + '/' + filename);
    var fileContent = fs.readFileSync(filePath).toString();
    var ast = esprima.parse(fileContent, { sourceType: 'module' });

    return ast;
}
