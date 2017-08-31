'use strict'

const ast = require('./astHelper');
const utils = require('./utils');
const fs = require('fs');
const esprima = require('esprima');
const path = require('path');
const chalk = require('chalk');

exports.readAST = function readAST (filename) {
    var filePath = path.normalize(process.cwd() + '\\' + filename);
    var fileContent = fs.readFileSync(filePath).toString();
    var ast = esprima.parse(fileContent, {sourceType: 'module'});

    return ast;
}

exports.writeAST = function writeAST (filename, ast) {
    var filePath = path.normalize(process.cwd() + '\\' + filename);
    var file = fs.createWriteStream(filePath);
    file.on('error', function(err) {
        console.log(err);
    });
    file.write(utils.generate(ast));
    file.end();
}

exports.extendMutationTypes = function extendMutationTypes (filename, params) {
    var ast = this.readAST(filename);
    ast = this.addMutationTypes(ast, params.map((item) => {
        return this.makeMutTypesEntry(item);
    }));

    this.writeAST(filename, ast);
    console.log(chalk.green('EXTENDED ') + chalk.yellow(filename));
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