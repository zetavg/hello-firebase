/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path');
const getCacheIdentifier = require('react-dev-utils/getCacheIdentifier');
const TransformInlineAppConfig = require('./babel-plugins/transform-inline-app-config');

function hash(str) {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

module.exports = {
  // The Webpack config to use when compiling your react app for development or production.
  webpack: function (config, env) {
    const isEnvDevelopment = env === 'development';
    const isEnvProduction = env === 'production';

    // ...add your webpack config

    config.module.rules
      .find((r) => r.oneOf)
      .oneOf.filter(
        ({ loader }) =>
          loader && loader.match(/\/node_modules\/babel-loader\//),
      )
      .forEach((babelLoader) => {
        if (babelLoader.options.plugins) {
          babelLoader.options.plugins.push(TransformInlineAppConfig);
        }
        const configHash = hash(
          JSON.stringify(require(path.resolve(__dirname, '.config.js'))),
        ).toString();
        const cacheIdentifier =
          getCacheIdentifier(
            isEnvProduction ? 'production' : isEnvDevelopment && 'development',
            [
              'babel-plugin-named-asset-import',
              'babel-preset-react-app',
              'react-dev-utils',
              'react-scripts',
            ],
          ) + `-${configHash}`;
        babelLoader.options.cacheIdentifier = cacheIdentifier;
      });

    return {
      ...config,
      plugins: [
        ...config.plugins.filter((plugin) => {
          // Do not use eslint-webpack-plugin
          if (plugin.constructor.name === 'ESLintWebpackPlugin') return false;

          return true;
        }),
      ],
    };
  },
  // The Jest config to use when running your jest tests - note that the normal rewires do not
  // work here.
  jest: function (config) {
    // ...add your jest config customisation...
    // Example: enable/disable some tests based on environment variables in the .env file.
    // if (!config.testPathIgnorePatterns) {
    //   config.testPathIgnorePatterns = [];
    // }
    // if (!process.env.RUN_COMPONENT_TESTS) {
    //   config.testPathIgnorePatterns.push(
    //     '<rootDir>/src/components/**/*.test.js',
    //   );
    // }
    // if (!process.env.RUN_REDUCER_TESTS) {
    //   config.testPathIgnorePatterns.push('<rootDir>/src/reducers/**/*.test.js');
    // }
    return config;
  },
  // The function to use to create a webpack dev server configuration when running the development
  // server with 'npm run start' or 'yarn start'.
  // Example: set the dev server to use a specific certificate in https.
  devServer: function (configFunction) {
    // Return the replacement function for create-react-app to use to generate the Webpack
    // Development Server config. "configFunction" is the function that would normally have
    // been used to generate the Webpack Development server config - you can use it to create
    // a starting configuration to then modify instead of having to create a config from scratch.
    return function (proxy, allowedHost) {
      // Create the default config by calling configFunction with the proxy/allowedHost parameters
      const config = configFunction(proxy, allowedHost);

      // Change the https certificate options to match your certificate, using the .env file to
      // set the file paths & passphrase.
      // const fs = require('fs');
      // config.https = {
      //   key: fs.readFileSync(process.env.REACT_HTTPS_KEY, 'utf8'),
      //   cert: fs.readFileSync(process.env.REACT_HTTPS_CERT, 'utf8'),
      //   ca: fs.readFileSync(process.env.REACT_HTTPS_CA, 'utf8'),
      //   passphrase: process.env.REACT_HTTPS_PASS,
      // };

      // Return your customised Webpack Development Server config.
      return config;
    };
  },
  // The paths config to use when compiling your react app for development or production.
  paths: function (paths, env) {
    // ...add your paths config
    return {
      ...paths,
      appPath: path.resolve(__dirname, 'app'),
      appBuild: path.resolve(__dirname, 'app', 'build'),
      appPublic: path.resolve(__dirname, 'app', 'public'),
      appHtml: path.resolve(__dirname, 'app', 'public', 'index.html'),
      appIndexJs: path.resolve(__dirname, 'app', 'src', 'index.tsx'),
      appSrc: path.resolve(__dirname, 'app', 'src'),
      appTsConfig: path.resolve(__dirname, 'app', 'tsconfig.json'),
      testsSetup: path.resolve(__dirname, 'app', 'src', 'setupTests.ts'),
      proxySetup: path.resolve(__dirname, 'app', 'src', 'setupProxy.ts'),
      swSrc: path.resolve(__dirname, 'app', 'src', 'service-worker.ts'),
      appTypeDeclarations: path.resolve(
        __dirname,
        'app',
        'src',
        'react-app-env.d.ts',
      ),
    };
  },
};
