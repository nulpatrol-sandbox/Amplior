'use strict'

const ast = require('./astHelper');
const utils = require('./utils');
const file = require('./file');
const mixinHelper = require('./mixinHelper');
const StoreModule = require('./StoreModule');
const Route = require('./Route');
const Language = require('./Language');
const fs = require('fs');
const esprima = require('esprima');
const path = require('path');
const chalk = require('chalk');

exports.routeList = function routeList (path) {
    var route = new Route(path);
    route.showRouteList();
};

exports.fixLanguages = function fixLanguages (path) {
    var languages = new Language(path);
    languages.fix();
};

exports.addStoreModule = function addStoreModule (stateFields, moduleName, storePath) {
    const sm = new StoreModule(moduleName, stateFields, storePath);
    sm.save();
};

exports.addMixinFile = function addMixinFile (stateFields, filename) {
    let code = utils.generate(mixinHelper.makeMixinFile(stateFields));
    file.writeToFile(filename, code);
    console.log(chalk.green('ADDED ') + chalk.yellow(filename));
};

exports.parseStoreFile = function parseStoreFile (ast) {
    var stateDeclaration, gettersDeclaration, mutationsDeclaration;
    ast.body.forEach(function (element) {
        if (element.type === 'VariableDeclaration') {
            let decl = element.declarations[0];
            if (decl.id.name == 'state') {
               stateDeclaration = element;
            } else if (decl.id.name == 'getters') {
                gettersDeclaration = element;
            } else if (decl.id.name == 'mutations') {
                mutationsDeclaration = element;
            }
        }
    });

    mutationsDeclaration.declarations[0].init.properties.push(this.makeMutation('userName'));
    stateDeclaration.declarations[0].init.properties.push(this.makeStateEntry('userName'));
    gettersDeclaration.declarations[0].init.properties.push(this.makeGetter('userName'));
    //return this.makeStoreFile(stateDeclaration, gettersDeclaration, mutationsDeclaration);
};

exports.makeApiFile = function makeApiFile () {
    return ast.makeExportDefault(
        ast.makeObjectExpression([
            ast.makeProperty(ast.makeIdentifier('getUser'), ast.makeFunctionExpression(
                [ 
                    ast.makeIdentifier('obj'),
                    ast.makeIdentifier('callback'),
                ],
                ast.makeBlockStatement([
                    ast.makeCallExpression(
                        ast.makeMemberExpression(
                            ast.makeCallExpression(
                                ast.makeMemberExpression(
                                    ast.makeIdentifier('axios'),
                                    ast.makeIdentifier('post')
                                ),
                                [ ast.makeLiteral('/all') ]
                            ),
                            ast.makeIdentifier('then')
                        ),
                        [ ast.makeFunctionExpression(
                            [ ast.makeIdentifier('data') ],
                            ast.makeBlockStatement([
                                ast.makeExpressionStatement(
                                    ast.makeCallExpression(
                                        ast.makeIdentifier('callback'),
                                        [ ast.makeIdentifier('data') ]
                                    )
                                )
                            ])
                        ) ]
                    )
                ])
            )),
        ])
    );
};
