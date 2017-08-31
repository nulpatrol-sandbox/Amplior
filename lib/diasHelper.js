'use strict'

const ast = require('./astHelper');
const utils = require('./utils');
const escodegen = require('escodegen');
const esformatter = require('esformatter');
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
    file.write(this.generate(ast));
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

exports.generate = function generate (ast) {
    // this.parseStoreFile(ast)
    let code = escodegen.generate(ast);
    var options = {
        indent : {
            value : '    ',
        },
        lineBreak: {
            before: {
                "VariableDeclaration": ">1",
                "ExportDefaultDeclaration": ">1",
            }
        }
    };
    return esformatter.format(code, options);
}

exports.makeStateEntry = function makeStateEntry(name) {
    if (typeof name === 'string') {
        return ast.makeProperty(
            ast.makeIdentifier(utils.normalizeVarName(name)), 
            ast.makeIdentifier('undefined')
        );
    } else if (typeof name === 'object') {
        return ast.makeProperty(
            ast.makeIdentifier(utils.normalizeVarName(name.objectName)), 
            ast.makeObjectExpression(name.fields.map(entry => this.makeStateEntry(entry)))
        );
    }
}

exports.makeState = function makeState (names) {
    let stateEntries = [];
    names.forEach((item) => {
        stateEntries.push(this.makeStateEntry(item));
    });

    return ast.makeVariableDeclaration(
        'state',
        'const',
        ast.makeObjectExpression(stateEntries)
    );
}

exports.makeGetter = function makeGetter (name) {
    return ast.makeProperty(ast.makeIdentifier(utils.normalizeVarName(name)), ast.makeArrowFunctionExpression(
        [ ast.makeIdentifier('state') ],
        ast.makeMemberExpression(
            ast.makeIdentifier('state'), 
            ast.makeIdentifier(name)
        )
    ));
}

exports.makeGetters = function makeGetters (names) {
    let getters = [];
    names.forEach((item) => {
        getters.push(this.makeGetter(item));
    });

    return ast.makeVariableDeclaration(
        'getters',
        'const',
        ast.makeObjectExpression(getters)
    );
}

exports.makeMutation = function makeMutation (name) {
    return ast.makeProperty(
        ast.makeMemberExpression(
            ast.makeIdentifier('types'), 
            ast.makeIdentifier(utils.makeMutTypeName(name))
        ), 
        ast.makeFunctionExpression(
            [ 
                ast.makeIdentifier('state'),
                ast.makeIdentifier('payload'),
            ],
            ast.makeBlockStatement([ 
                ast.makeExpressionStatement(
                    ast.makeAssignmentExpression(
                        ast.makeMemberExpression(
                            ast.makeIdentifier('state'), 
                            ast.makeIdentifier(name)
                        ),
                        ast.makeMemberExpression(
                            ast.makeIdentifier('payload'), 
                            ast.makeIdentifier(utils.normalizeVarName(name))
                        )
                    )
                ) 
            ])
        )
    )
}

exports.makeActions = function makeActions () {
    return ast.makeVariableDeclaration(
        'actions',
        'const',
        ast.makeObjectExpression([])
    );
}

exports.makeMutations = function makeMutations (names) {
    let mutations = [];
    names.forEach((item) => {
        mutations.push(this.makeMutation(item));
    });

    return ast.makeVariableDeclaration(
        'mutations',
        'const',
        ast.makeObjectExpression(mutations)
    );
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

exports.makeStoreFile = function makeStoreFile (names, moduleName) {
    return ast.makeModule([
        ast.makeImportDeclaration('types', '../mutation-types'),
        ast.makeImportDeclaration(moduleName + 'Api', '../../api/' + moduleName, false),
        this.makeState(names),
        this.makeGetters(utils.normalizeFields(names)),
        this.makeActions(),
        this.makeMutations(utils.normalizeFields(names)),
        this.makeStoreFileExport(),
    ]);
}

exports.makeStoreFileExport = function makeStoreFileExport () {
    return ast.makeExportDefault(
        ast.makeObjectExpression([
            ast.makeProperty(ast.makeIdentifier('state'), ast.makeIdentifier('state'), true),
            ast.makeProperty(ast.makeIdentifier('getters'), ast.makeIdentifier('getters'), true),
            ast.makeProperty(ast.makeIdentifier('actions'), ast.makeIdentifier('actions'), true),
            ast.makeProperty(ast.makeIdentifier('mutations'), ast.makeIdentifier('mutations'), true),
        ])
    );
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