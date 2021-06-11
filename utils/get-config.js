// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

const GCLOUD_PROJECT = process.env.GCLOUD_PROJECT;

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

function deepMerge(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

function getConfigAndEnv(calledBy) {
  let loadedConfig;
  try {
    loadedConfig = require('../.config.js');
  } catch (e) {
    throw new Error('Cannot load .config.js from project directory');
  }
  if (typeof loadedConfig !== 'object') {
    throw new Error('Export value of .config.js is not an object');
  }
  if (!loadedConfig.default) {
    throw new Error('Missing default config in .config.js');
  }

  const firebasercPath = path.resolve(__dirname, '..', '.firebaserc');
  let firebaserc = {};
  try {
    if (fs.existsSync(firebasercPath)) {
      const data = fs.readFileSync(firebasercPath);
      firebaserc = JSON.parse(data);
    }
  } catch (e) {
    throw new Error(`Cannot read .firebaserc, ${e.message}`);
  }

  const [env] =
    calledBy === 'emulators'
      ? ['local']
      : Object.entries(firebaserc.projects || {}).find(
          ([alias, id]) => alias !== 'default' && id === GCLOUD_PROJECT,
        ) || [];

  const configObj = deepMerge(
    loadedConfig.default,
    (env && loadedConfig[env]) || {},
    {
      x_firebase_project: {
        id: GCLOUD_PROJECT,
      },
    },
  );

  return [configObj, env];
}

module.exports = {
  getConfigAndEnv,
  isObject,
  deepMerge,
};
