const ast = require('./astHelper');
const utils = require('./utils');

class StoreModule {
    constructor(name, fields) {
        this.name = name;
        this.fields = fields;
        this.normalizedFields = utils.normalizeFields(this.fields);
    }

    makeStateEntry(name) {
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

    makeState () {
        let stateEntries = [];
        this.fields.forEach((item) => {
            stateEntries.push(this.makeStateEntry(item));
        });

        return ast.makeVariableDeclaration(
            'state',
            'const',
            ast.makeObjectExpression(stateEntries)
        );
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

        return ast.makeVariableDeclaration(
            'getters',
            'const',
            ast.makeObjectExpression(getters)
        );
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

    makeMutations () {
        let mutations = [];
        this.normalizedFields.forEach((item) => {
            mutations.push(this.makeMutation(item));
        });

        return ast.makeVariableDeclaration(
            'mutations',
            'const',
            ast.makeObjectExpression(mutations)
        );
    }

    makeActions () {
        return ast.makeVariableDeclaration(
            'actions',
            'const',
            ast.makeObjectExpression([])
        );
    }

    makeStoreFileExport () {
        return ast.makeExportDefault(
            ast.makeObjectExpression([
                ast.makeProperty(ast.makeIdentifier('state'), ast.makeIdentifier('state'), true),
                ast.makeProperty(ast.makeIdentifier('getters'), ast.makeIdentifier('getters'), true),
                ast.makeProperty(ast.makeIdentifier('actions'), ast.makeIdentifier('actions'), true),
                ast.makeProperty(ast.makeIdentifier('mutations'), ast.makeIdentifier('mutations'), true),
            ])
        );
    }

    makeStoreFile () {
        return ast.makeModule([
            ast.makeImportDeclaration('types', '../mutation-types'),
            ast.makeImportDeclaration(this.name + 'Api', '../../api/' + this.name, false),
            this.makeState(),
            this.makeGetters(),
            this.makeActions(),
            this.makeMutations(),
            this.makeStoreFileExport(),
        ]);
    }

    readIndexFile () {
        //console.log(utils.readAst())
    }
}

module.exports = StoreModule;