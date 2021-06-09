// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { exec } = require('child_process');

const GCLOUD_PROJECT = process.env.GCLOUD_PROJECT;
const [, , writeTo, calledBy] = process.argv;

function logError(message) {
  console.error(`[ERROR] ${message}`);
}

function exitWithError(message) {
  logError(`Error on updating function configs: ${message}`);
  process.exit(1);
}

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

let loadedConfig;
try {
  loadedConfig = require('../.config.js');
} catch (e) {
  exitWithError('Cannot load .config.js from project directory');
}
if (typeof loadedConfig !== 'object') {
  exitWithError('Export value of .config.js is not an object');
}
if (!loadedConfig.default) {
  exitWithError('[ERROR] Missing default config in .config.js');
}

const firebasercPath = path.resolve(__dirname, '..', '.firebaserc');
let firebaserc = {};
try {
  if (fs.existsSync(firebasercPath)) {
    const data = fs.readFileSync(firebasercPath);
    firebaserc = JSON.parse(data);
  }
} catch (e) {
  exitWithError(`Cannot read .firebaserc, ${e.message}`);
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

if (writeTo === 'runtimeconfig') {
  const runtimeconfigPath = path.resolve(
    __dirname,
    '..',
    'functions',
    'lib',
    '.runtimeconfig.json',
  );
  fs.writeFileSync(runtimeconfigPath, JSON.stringify(configObj, null, 2));
  process.exit(0);
}

function collectConfigStrings(cfgObj, path = '') {
  return Object.entries(cfgObj)
    .map(([key, value]) => {
      const currentPath = [path, key].filter((s) => s).join('.');
      if (isObject(value)) return collectConfigStrings(value, currentPath);

      return [`${currentPath}=${value}`];
    })
    .flat();
}

const configString = collectConfigStrings(configObj).join(' ');

console.log(
  `[${env}] Updating function configs for project ${GCLOUD_PROJECT} ...`,
);

exec(
  `firebase functions:config:set --project=${GCLOUD_PROJECT} ${configString}`,
  (error, stdout, stderr) => {
    if (error || stderr) {
      exitWithError(stderr.trim() + stdout.trim());
    }

    console.log(
      (calledBy === 'deploy'
        ? stdout.replace(
            'Please deploy your functions for the change to take effect by running \u001b[1mfirebase deploy --only functions\u001b[22m',
            '',
          )
        : stdout
      ).trim(),
    );
    console.log(`Done updating function configs for project ${GCLOUD_PROJECT}`);
  },
);
