'use strict'

const ast = require('./astHelper');
const utils = require('./utils');
const file = require('./file');
const mixinHelper = require('./mixinHelper');
const StoreModule = require('./StoreModule');
const fs = require('fs');
const esprima = require('esprima');
const path = require('path');
const chalk = require('chalk');

exports.extendMutationTypes = function extendMutationTypes (filename, params) {
    var ast = utils.readAST(filename);
    ast = this.addMutationTypes(ast, params.map((item) => {
        return this.makeMutTypesEntry(item);
    }));

    file.writeAST(filename, ast);
    console.log(chalk.green('EXTENDED ') + chalk.yellow(filename));
}

exports.addStoreFile = function addStoreFile (stateFields, moduleName, storePath) {
    var sm = new StoreModule(moduleName, stateFields, storePath);
    let modulePath = path.normalize(storePath + 'modules/' + moduleName + '.js');
    let indexPath = path.normalize(storePath + 'index.js');

    let code = utils.generate(sm.makeStoreFile());
    file.writeToFile(modulePath, code);
    console.log(chalk.green('ADDED ') + chalk.yellow(modulePath));

    code = utils.generate(sm.extendIndexFile());
    file.writeToFile(indexPath, code);
    console.log(chalk.green('EXTENDED ') + chalk.yellow(indexPath));
}

exports.addMixinFile = function addMixinFile (stateFields, filename) {
    let code = utils.generate(mixinHelper.makeMixinFile(stateFields));
    file.writeToFile(filename, code);
    console.log(chalk.green('ADDED ') + chalk.yellow(filename));
}

exports.addMutationTypes = function addMutationType (ast, typeAst) {
    ast.body.push(...typeAst);
    return ast;
}

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
}

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
}

exports.makeMutTypesEntry = function makeMutTypes (name, prefix = true) {
    let mutTypeName = utils.makeMutTypeName(name, prefix);

    return ast.makeExportNamed(
        ast.makeVariableDeclaration(mutTypeName, 'const', ast.makeLiteral(mutTypeName))
    );
}