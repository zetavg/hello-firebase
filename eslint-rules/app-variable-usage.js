const COMMON_DESCRIPTION =
  'The "app" variable is a compile time variable and can only be used with specific ways (See transform-inline-app-config).';

const RESERVED_APP_PROPERTIES = ['config', 'firebaseConfig'];

function isDeclaratorId(node) {
  if (node.parent) {
    if (
      (node.parent.type === 'VariableDeclarator' && node.parent.id === node) ||
      node.parent.type === 'ImportSpecifier' ||
      node.parent.type === 'ImportDefaultSpecifier' ||
      node.parent.type === 'ObjectPattern'
    )
      return true;

    if (node.parent.parent && node.parent.parent.type === 'ObjectPattern')
      return true;
  }
  return false;
}

function getAvailableVariablesInScope(scope) {
  if (!scope) return [];

  return [
    ...(scope.variables || []),
    ...getAvailableVariablesInScope(scope.upper),
  ];
}

/**
 * Works with `babel-plugins/transform-inline-app-config` to prevent unsupported usage of `app.something()`.
 */
module.exports = {
  meta: {
    docs: {
      description: COMMON_DESCRIPTION,
    },
    schema: [], // no options
    messages: {
      conflict: `This usage of "app" ("{{ usage }}") might conflict with Babel's transform-inline-app-config, please use another syntax. ${COMMON_DESCRIPTION}`,
      missingProperty: `"app" is not expected to be used with no property. ${COMMON_DESCRIPTION}`,
      unknownConfigUsage: `Unknown usage of "config" on "app", it should be something like "app.config().key1.key2". ${COMMON_DESCRIPTION}`,
      unknownFirebaseConfigUsage: `Unknown usage of "firebaseConfig" on "app", it should be something like "app.firebaseConfig()". ${COMMON_DESCRIPTION}`,
      unknown: `Unknown property "{{ propertyName }}" of "app". ${COMMON_DESCRIPTION}`,
    },
  },
  create: function (context) {
    return {
      Identifier(node) {
        if (node.name !== 'app') return;

        if (isDeclaratorId(node)) return;

        if (
          node.parent.type === 'MemberExpression' &&
          node.parent.property === node &&
          !node.parent.computed
        ) {
          // The identifier is used as a property, `something.app` but not `something[app]`
          return;
        }

        if (
          getAvailableVariablesInScope(context.getScope()).some(
            (v) => v.name === 'app',
          )
        ) {
          // `app` is defined in the scope.
          // We still need to check if the usage have possible conflict with Babel's rules
          if (
            node.parent.type === 'MemberExpression' &&
            node.parent.property &&
            node.parent.parent &&
            node.parent.parent.type === 'CallExpression' &&
            RESERVED_APP_PROPERTIES.includes(node.parent.property.name)
          ) {
            context.report({
              node: node.parent.parent,
              messageId: 'conflict',
              data: {
                usage: `app.${node.parent.property.name}()`,
              },
            });
          }

          return;
        }

        const propertyName =
          node.parent &&
          node.parent.type === 'MemberExpression' &&
          node.parent.property &&
          node.parent.property !== node &&
          node.parent.property.name;

        if (!propertyName) {
          context.report({
            node: node,
            messageId: 'missingProperty',
          });

          return;
        }

        switch (propertyName) {
          case 'config': {
            if (
              !node.parent.parent ||
              node.parent.parent.type !== 'CallExpression'
            ) {
              context.report({
                node: node.parent,
                messageId: 'unknownConfigUsage',
              });
              return;
            }

            if (
              !node.parent.parent.parent ||
              node.parent.parent.parent.type !== 'MemberExpression'
            ) {
              context.report({
                node: node.parent.parent,
                messageId: 'unknownConfigUsage',
              });
              return;
            }

            if (
              node.parent.parent.parent.computed ||
              node.parent.parent.parent.property.type !== 'Identifier' ||
              !node.parent.parent.parent.parent ||
              node.parent.parent.parent.parent.type !== 'MemberExpression'
            ) {
              context.report({
                node: node.parent.parent.parent,
                messageId: 'unknownConfigUsage',
              });
              return;
            }

            if (
              node.parent.parent.parent.parent.computed ||
              node.parent.parent.parent.parent.property.type !== 'Identifier'
            ) {
              context.report({
                node: node.parent.parent.parent.parent,
                messageId: 'unknownConfigUsage',
              });
              return;
            }

            return;
          }

          case 'firebaseConfig': {
            if (
              !node.parent.parent ||
              node.parent.parent.type !== 'CallExpression'
            ) {
              context.report({
                node: node.parent,
                messageId: 'unknownFirebaseConfigUsage',
              });
              return;
            }

            return;
          }

          default: {
            context.report({
              node: node.parent,
              messageId: 'unknown',
              data: {
                propertyName,
              },
            });

            return;
          }
        }
      },
    };
  },
};
