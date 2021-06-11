/* eslint-disable @typescript-eslint/no-var-requires */
const { execSync } = require('child_process');

const [config] = require('../utils/get-config').getConfigAndEnv(
  process.env.EMULATOR && 'emulators',
);

const webApp = require('../utils/get-firebase-apps').getFirebaseWebApp();

const firebaseSdkConfigCommand = `echo "$(firebase apps:sdkconfig WEB ${webApp.appId})"`;
const firebaseSdkConfigOutput = execSync(firebaseSdkConfigCommand);

const [, firebaseSdkConfigJsonString] =
  firebaseSdkConfigOutput.toString().match(/initializeApp\((\{[^}]*\})/) || [];

let firebaseSdkConfig = {};
try {
  firebaseSdkConfig = JSON.parse(firebaseSdkConfigJsonString);
} catch (e) {
  throw new Error(
    `Cannot parse Firebase SDK config from \`${firebaseSdkConfigCommand}\` output: "${firebaseSdkConfigOutput}". Hint: make sure \`${firebaseSdkConfigCommand}\` works as expect.`,
  );
}

/**
 * Replaces `app.config().key1.key2` with string literal from project's `.config.js` at compile time. (`app.config()` works similarly to Firebase's `functions.config()`)
 * It also replaces `app.firebaseConfig()` into Firebase config object literal with the active project's web app config from Firebase CLI. (i.e. `app.firebaseConfig()` can be passed into the `firebase.initializeApp()` function, see https://firebase.google.com/docs/web/setup#add-sdks-initialize)
 *
 * The ESLint rule `eslint-rules/app-variable-usage` prevents unsupported usage of `app.something()`.
 */
module.exports = function ({ types: t }) {
  return {
    name: 'transform-inline-app-config',
    visitor: {
      // For `app.config().key1.key2`
      MemberExpression(path) {
        let match;
        try {
          match = path.get('object.object.callee').matchesPattern('app.config');
          // eslint-disable-next-line no-empty
        } catch (e) {}

        if (match) {
          const key1 = path.get('object').toComputedKey();
          const key2 = path.toComputedKey();

          if (t.isStringLiteral(key1) && t.isStringLiteral(key2)) {
            const value = (config[key1.value] || {})[key2.value];

            if (typeof value !== 'undefined') {
              path.replaceWith(t.valueToNode(`${value}`));
            } else {
              path.replaceWith(t.valueToNode(undefined));
            }
          }

          return;
        }
      },
      // For `app.firebaseConfig()`
      CallExpression(path) {
        let match;
        try {
          match = path.get('callee').matchesPattern('app.firebaseConfig');
          // eslint-disable-next-line no-empty
        } catch (e) {}

        if (match) {
          path.replaceWith(t.valueToNode(firebaseSdkConfig));

          return;
        }
      },
    },
  };
};
