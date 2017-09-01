const ast = require('./astHelper');
const utils = require('./utils');

exports.makeMixinFile = function makeMixinFile (names) {
    return ast.makeModule([
        ast.makeImportDeclaration('types', '../store/mutation-types'),
        this.makeExportComputed(names),
    ]);
}

exports.makeExportComputed = function makeExportComputed (names) {
    return ast.makeExportDefault(
        ast.makeObjectExpression([
            ast.makeProperty(ast.makeIdentifier('computed'), ast.makeObjectExpression(
                this.makeAttributes(names)
            )),
        ])
    );
}

exports.makeGetStatement = function makeGetStatement (name) {
    return ast.makeProperty(
        ast.makeIdentifier('get'),
        ast.makeFunctionExpression(
            [], 
            ast.makeBlockStatement([
                ast.makeReturnStatement(
                    ast.makeMemberExpression(
                        ast.makeMemberExpression(
                            ast.makeMemberExpression(
                                ast.makeThisExpression(),
                                ast.makeIdentifier('$store')
                            ),
                            ast.makeIdentifier('getters')
                        ),
                        ast.makeIdentifier(name)
                    )
                )
            ])
        )
    );
}

exports.makeSetStatement = function makeSetStatement (name) {
    return ast.makeProperty(
        ast.makeIdentifier('set'),
        ast.makeFunctionExpression(
            [ ast.makeIdentifier('value') ], 
            ast.makeBlockStatement([
                ast.makeExpressionStatement(
                    ast.makeCallExpression(
                        ast.makeMemberExpression(
                            ast.makeMemberExpression(
                                ast.makeThisExpression(),
                                ast.makeIdentifier('$store')
                            ),
                            ast.makeIdentifier('commit')
                        ),
                        [ 
                            ast.makeMemberExpression(
                                ast.makeIdentifier('types'),
                                ast.makeIdentifier(utils.makeMutTypeName(name))
                            ),
                            ast.makeObjectExpression([
                                ast.makeProperty(
                                    ast.makeIdentifier(name),
                                    ast.makeIdentifier('value')
                                ),
                            ])
                        ]
                    )
                ),
            ])
        )
    );
}

exports.makeAttributes = function makeAttributes (names) {
    return names.map((item) => {
        return this.makeAttribute(item);
    });
}

exports.makeAttribute = function makeAttribute (name) {
    let normalized = utils.normalizeVarName(name);
    return ast.makeProperty(
        ast.makeIdentifier(normalized),
        ast.makeObjectExpression([
            this.makeGetStatement(normalized),
            this.makeSetStatement(normalized),
        ])
    );
}