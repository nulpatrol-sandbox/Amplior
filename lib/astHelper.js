'use strict'

exports.makeModule = function makeModule (body) {
    return {
        type: 'Program',
        body: body,
        sourceType: 'module',
    }
}

exports.makeLiteral = function makeLiteral (value) {
    return {
        type: 'Literal',
        value: value,
    }
}

exports.makeMemberExpression = function makeMemberExpression (obj, prop) {
    return {
        type: 'MemberExpression',
        object: obj,
        property: prop,
    }
}

exports.makeArrowFunctionExpression = function makeArrowFunctionExpression (params, body) {
    return {
        type: 'ArrowFunctionExpression',
        params: params,
        body: body,
    }
}

exports.makeFunctionExpression = function makeFunctionExpression (params, body) {
    return {
        type: 'FunctionExpression',
        params: params,
        body: body,
    }
}

exports.makeAssignmentExpression = function makeAssignmentExpression (left, right) {
    return {
        type: 'AssignmentExpression',
        operator: '=',
        left: left,
        right: right,
    }
}

exports.makeExpressionStatement = function makeExpressionStatement (expression) {
    return {
        type: 'ExpressionStatement',
        expression: expression,
    }
}

exports.makeBlockStatement = function makeBlockStatement (body) {
    return {
        type: 'BlockStatement',
        body: body,
    }
}

exports.makeArrayExpression = function makeArrayExpression () {
    return {
        type: 'ArrayExpression',
        elements: [],
    }
}

exports.makeProperty = function makeProperty (key, value, shorthand = false) {
    return {
        type: 'Property',
        key: key,
        value: value,
        computed: (key.type === 'MemberExpression' ? true : false),
        method: (value.type === 'FunctionExpression' ? true : false),
        shorthand: shorthand,
    }
}

exports.makeObjectExpression = function makeObjectExpression (properties) {
    return {
        type: 'ObjectExpression',
        properties: properties,
    }
}

exports.makeVariableDeclaration = function makeVariableDeclaration (name, kind, init) {
    return {
        type: 'VariableDeclaration',
        declarations: [
            this.makeVariableDeclarator(name, init),
        ],
        kind: kind,
    }
}

exports.makeVariableDeclarator = function makeVariableDeclarator (name, init) {
    return {
        type: 'VariableDeclarator',
        id: this.makeIdentifier(name),
        init: init,
    }
}

exports.makeLiteralProperty = function makeLiteralProperty(name, value) {
    return {
        type: 'Property',
        key: this.makeIdentifier(name),
        value: this.makeLiteral(value),
    }
};

exports.makeExportDefault = function makeExportDefault(declaration) {
    return {
        type: 'ExportDefaultDeclaration',
        declaration: declaration
    }
};

exports.makeExportNamed = function makeExportNamed(declaration) {
    return {
        type: 'ExportNamedDeclaration',
        declaration: declaration
    }
};

exports.makeTranslation = function makeTranslation() {
    return {
        type: 'ObjectExpression',
        properties: [
            {
                type: 'Property',
                key: {
                    type: 'Identifier',
                    name: 'translation',
                },
                value: {
                    type: 'ObjectExpression',
                    properties: [
                    ],
                },
            }
        ]
    }
};

exports.makeIdentifier = function makeIdentifier (name) {
    return {
        type: 'Identifier',
        name: name,
    }
};

exports.makeImportNamespaceSpecifier = function makeImportNamespaceSpecifier (name) {
    return {
        type: 'ImportNamespaceSpecifier',
        local: this.makeIdentifier(name),
    }
}

exports.makeImportDefaultSpecifier = function makeImportDefaultSpecifier (name) {
    return {
        type: 'ImportDefaultSpecifier',
        local: this.makeIdentifier(name),
    }
}

exports.makeImportDeclaration = function makeImportDeclaration (name, source, namespace = true) {
    return {
        type: 'ImportDeclaration',
        specifiers: [ 
            namespace ? 
                this.makeImportNamespaceSpecifier(name) :
                this.makeImportDefaultSpecifier(name),
        ],
        source: this.makeLiteral(source),
    }
};

exports.makeCallExpression = function makeCallExpression (callee, args) {
    return {
        type: 'CallExpression',
        callee: callee,
        arguments: args,
    }
};