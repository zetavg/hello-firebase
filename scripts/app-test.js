// eslint-disable-next-line @typescript-eslint/no-var-requires
let paths = require('react-app-rewired/scripts/utils/paths');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const overrides = require('react-app-rewired/config-overrides');

const pathsConfigPath = `${paths.scriptVersion}/config/paths.js`;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pathsConfig = require(pathsConfigPath);
require.cache[require.resolve(pathsConfigPath)].exports = overrides.paths(
  pathsConfig,
  process.env.NODE_ENV,
);

require('react-app-rewired/scripts/test');
