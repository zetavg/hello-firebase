// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { exec } = require('child_process');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getConfigAndEnv, isObject } = require('../utils/get-config');

const GCLOUD_PROJECT = process.env.GCLOUD_PROJECT;
const [, , writeTo, calledBy] = process.argv;

function logError(message) {
  console.error(`[ERROR] ${message}`);
}

function exitWithError(message) {
  logError(`Error on updating function configs: ${message}`);
  process.exit(1);
}

const [configObj, env] = getConfigAndEnv(calledBy);

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
