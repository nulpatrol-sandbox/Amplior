const ast = require('./astHelper');
const utils = require('./utils');
const file = require('./file');
const conf = require('./Config');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class StoreModule {
    constructor(name, fields, storePath) {
        this.name = name;
        this.fields = fields;
        this.storePath = storePath;
        this.normalizedFields = utils.normalizeFields(this.fields);
    }

    save() {
        let folderN = path.normalize(this.storePath + '/modules/' + this.name);
        fs.pathExists(folderN).then(exists => {
            if (!exists) {
                fs.ensureDir(folderN).then(() => {
                    this.modulePath = folderN;
                    this.makeIndexFile();
                    this.makeGettersFile();
                    this.makeMutationsFile();
                    this.makeStateFile();
                    this.makeActionsFile();
                    this.extendIndexFile();
                })
            }
        });
    }

    makeIndexFile() {
        let indexPath = path.normalize(this.modulePath + '/index.js');
        let code = utils.generate(ast.makeModule([
            ast.makeImportDeclaration('actions', './actions', false),
            ast.makeImportDeclaration('getters', './getters', false),
            ast.makeImportDeclaration('mutations', './mutations', false),
            ast.makeImportDeclaration('state', './state', false),
            ast.makeExportDefault(
                ast.makeObjectExpression([
                    ast.makeProperty(ast.makeIdentifier('actions'), ast.makeIdentifier('actions'), true),
                    ast.makeProperty(ast.makeIdentifier('getters'), ast.makeIdentifier('getters'), true),
                    ast.makeProperty(ast.makeIdentifier('mutations'), ast.makeIdentifier('mutations'), true),
                    ast.makeProperty(ast.makeIdentifier('state'), ast.makeIdentifier('state'), true),
                ])
            ),
        ]));
        file.writeToFile(indexPath, code);
        console.log(chalk.green('ADDED ') + chalk.yellow(indexPath));
    }

    makeGettersFile() {
        let gettersPath = path.normalize(this.modulePath + '/getters.js');
        let code = utils.generate(this.makeGetters());
        file.writeToFile(gettersPath, code);
        console.log(chalk.green('ADDED ') + chalk.yellow(gettersPath));
    }

    makeMutationsFile() {
        let mutationsPath = path.normalize(this.modulePath + '/mutations.js');
        let mutations = [];
        this.normalizedFields.forEach((item) => {
            mutations.push(this.makeMutation(item));
        });
        let code = utils.generate(ast.makeModule([
            ast.makeImportDeclaration('types', '../../mutation-types'),
            ast.makeExportDefault(
                ast.makeObjectExpression(mutations)
            ),
        ]));
        file.writeToFile(mutationsPath, code);
        console.log(chalk.green('ADDED ') + chalk.yellow(mutationsPath));
    }

    makeStateFile() {
        let statePath = path.normalize(this.modulePath + '/state.js');
        let stateEntries = [];
        this.fields.forEach((item) => {
            stateEntries.push(this.makeStateEntry(item));
        });
        let code = utils.generate(ast.makeModule([
            ast.makeExportDefault(
                ast.makeObjectExpression(stateEntries)
            ),
        ]));
        file.writeToFile(statePath, code);
        console.log(chalk.green('ADDED ') + chalk.yellow(statePath));
    }

    makeActionsFile() {
        let actionsPath = path.normalize(this.modulePath + '/actions.js');
        let code = utils.generate(ast.makeModule([
            ast.makeImportDeclaration(this.name + 'Api', '../../../api/' + this.name, false),
            ast.makeImportDeclaration('types', '../../mutation-types'),
            /*ast.makeExportDefault(
                ast.makeObjectExpression(stateEntries)
            ),*/
        ]));
        file.writeToFile(actionsPath, code);
        console.log(chalk.green('ADDED ') + chalk.yellow(actionsPath));
    }

    makeStateEntry(name) {
        if (typeof name === 'string') {
            return ast.makeProperty(
                ast.makeIdentifier(utils.normalizeVarName(name)), 
                ast.makeIdentifier('null')
            );
        } else if (typeof name === 'object') {
            return ast.makeProperty(
                ast.makeIdentifier(utils.normalizeVarName(name.objectName)), 
                ast.makeObjectExpression(name.fields.map(entry => this.makeStateEntry(entry)))
            );
        }
    }

    makeGetter (name) {
        return ast.makeProperty(ast.makeIdentifier(utils.normalizeVarName(name)), ast.makeArrowFunctionExpression(
            [ ast.makeIdentifier('state') ],
            ast.makeMemberExpression(
                ast.makeIdentifier('state'), 
                ast.makeIdentifier(name)
            )
        ));
    }

    makeGetters () {
        let getters = [];
        this.normalizedFields.forEach((item) => {
            getters.push(this.makeGetter(item));
        });

        return ast.makeModule([
            ast.makeExportDefault(
                ast.makeObjectExpression(getters)
            )
        ]);
    }

    makeMutation (name) {
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

    extendIndexFile () {
        let indexAst = utils.readAST(this.storePath + 'index.js');
        let isModules = false;
        let bodyEntries = [];
        indexAst.body.forEach((item) => {
            if (item.type === 'ImportDeclaration') {
                if (item.source.value.indexOf('./modules/') !== -1) {
                    isModules = true;
                } else {
                    if (isModules) {
                        bodyEntries.push(ast.makeImportDeclaration(this.name, './modules/' + this.name, false));
                        isModules = false;
                    }
                }
            } else if (item.type === 'ExportDefaultDeclaration') {
                let props = item.declaration.arguments[0].properties;
                props.forEach((item) => {
                    if (item.key.name === 'modules') {
                        item.value.properties.push(ast.makeProperty(
                            ast.makeIdentifier(this.name),
                            ast.makeIdentifier(this.name),
                            true
                        ));
                    }
                });
            }
            bodyEntries.push(item);
        });

        return ast.makeModule(bodyEntries);
    }
}

module.exports = StoreModule;