const ast = require('./astHelper');
const utils = require('./utils');

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

exports.makeActions = function makeActions () {
    return ast.makeVariableDeclaration(
        'actions',
        'const',
        ast.makeObjectExpression([])
    );
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