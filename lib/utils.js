const decamelize = require('decamelize');
const camelize = require('camelize');

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

exports.makeMutTypeName = function makeMutTypeName (name, prefix = true) {
    let result = decamelize(name.replace('.', '_')).toUpperCase();
    result = (prefix ? 'SET_' + result : result);

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