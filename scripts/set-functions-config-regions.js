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
  logError(`Error on updating function_region configs: ${message}`);
  process.exit(1);
}

function underscore(str) {
  return str
    .replace(/(?:^|\.?)([A-Z])/g, function (_, x) {
      return '_' + x.toLowerCase();
    })
    .replace(/^_/, '');
}

process.env.DO_INIT = 'FALSE';

const consoleWarn = console.warn;
console.warn = (...args) => {
  if (
    args[0] &&
    args[0] ===
      '{"severity":"WARNING","message":"Warning, estimating Firebase Config based on GCLOUD_PROJECT. Initializing firebase-admin may fail"}'
  )
    return;

  consoleWarn(...args);
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const functions = require('../functions/lib');
const functionAndRegion = Object.entries(functions).map(([name, data]) => [
  name,
  (data.__trigger && data.__trigger.regions && data.__trigger.regions[0]) ||
    'us-central1',
]);
const functionRegionConfig = functionAndRegion.reduce((obj, [name, region]) => {
  obj[underscore(name)] = region;
  return obj;
}, {});

if (writeTo === 'runtimeconfig') {
  const runtimeconfigPath = path.resolve(
    __dirname,
    '..',
    'functions',
    'lib',
    '.runtimeconfig.json',
  );
  let existingRuntimeconfig = {};
  try {
    if (fs.existsSync(runtimeconfigPath)) {
      const data = fs.readFileSync(runtimeconfigPath);
      existingRuntimeconfig = JSON.parse(data);
    }
  } catch (e) {
    exitWithError(`Cannot read .runtimeconfig.json, ${e.message}`);
  }

  fs.writeFileSync(
    runtimeconfigPath,
    JSON.stringify(
      {
        ...existingRuntimeconfig,
        function_region: functionRegionConfig,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const configString = functionAndRegion
  .map(([name, region]) => `function_region.${underscore(name)}=${region}`)
  .join(' ');

console.log(
  `Updating function_region configs for project ${GCLOUD_PROJECT} ...`,
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
    console.log(
      `Done Updating function_region configs for project ${GCLOUD_PROJECT}`,
    );
  },
);
