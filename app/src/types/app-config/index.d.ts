/**
 * Note: `app.config().key1.key2` will be replaced by Babel in compile time.
 */
declare const app: {
  /**
   * Get the application's config from `.config.js` in the project directory. Only supports being used as `app.config().key1.key2`, since the code will be replaced by the config's literal value by Babel `transform-inline-app-config` in compile time.
   */
  config: () => { [key: string]: { [key: string]: string | undefined } };
  /**
   * Get the application's Firebase config from the active Firebase proejct's web app. The code will be replaced by the Firebase config literal value by Babel `transform-inline-app-config` in compile time.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  firebaseConfig: () => any;
};
