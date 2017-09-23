const ast = require('./astHelper');
const utils = require('./utils');
const conf = require('./Config');
const chalk = require('chalk');
const {table, getBorderCharacters} = require('table');

class Route {
    constructor(routerPath) {
        this.routerPath = routerPath;
        this.routeAst = utils.readAST(this.routerPath);
        this.routeAst.body.forEach((element) => {
            if (element.type == 'ImportDeclaration') {
                if (element.source.value.indexOf('components/') !== -1) {
                    //console.log(element.source.value);
                }
            } else if (element.type == 'VariableDeclaration') {
                if (element.declarations[0].id.name === 'routes') {
                    this.routeList = element.declarations[0];
                }
            }
        });
    }

    makeRouteEntry(name) {
        return ast.makeObjectExpression([
            ast.makeLiteralProperty('path', '/admin'),
            ast.makeProperty(ast.makeIdentifier('component'), ast.makeIdentifier('UserForm')),
            ast.makeLiteralProperty('name', 'user_edit'),
        ]);
    }

    showRouteList () {
        let data, output, config;

        data = [
            [chalk.green('URL'), chalk.green('Component'), chalk.green('Name')],
        ];

        this.routeList.init.elements.forEach((element) => {
            let nameIndex = element.properties.findIndex((property) => {
                return property.key.name == 'name';
            });
            let pathIndex = element.properties.findIndex((property) => {
                return property.key.name == 'path';
            });
            let componentIndex = element.properties.findIndex((property) => {
                return property.key.name == 'component';
            });
            data.push([
                (pathIndex !== -1) ? element.properties[pathIndex].value.value : '-',
                (componentIndex !== -1) ? element.properties[componentIndex].value.name : '-',
                (nameIndex !== -1) ? element.properties[nameIndex].value.value : '-',
            ]);
        });

        config = {
            border: getBorderCharacters('norc'),
        };

        output = table(data, config);
        console.log(output);
    }
}

module.exports = Route;