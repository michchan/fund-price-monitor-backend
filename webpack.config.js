const fs = require('fs')
const { createConfig, createBundleAnalyzerPlugin } = require('@michchan/webpack-config-aws-cdk')

// Services directory path
const SERVICES_PATH = 'build/services'
const DEFAULT_ANALYZER_PORT = 8888

// Create config for handlers folder of each service
module.exports = fs.readdirSync(SERVICES_PATH)
  .map((path, i) => {
    const defaultConfig = createConfig(`${SERVICES_PATH}/${path}/handlers`, __dirname)
    return {
      ...defaultConfig,
      plugins: [createBundleAnalyzerPlugin(path, DEFAULT_ANALYZER_PORT + i)],
      module: {
        rules: [
          /**
           * Use file loader to move chromnium .br files into /bin~
           * @link https://github.com/alixaxel/chrome-aws-lambda/issues/80
           *
           * This is for correctly bundling the chromnium instance required by 'chrome-aws-lambda',
           * from the helper 'launchPuppeteerBrowserSession' of 'simply-utils'.
           */
          {
            test: /chrome\-aws\-lambda\/bin\/(.+)\.br$/,
            use: [{ loader: 'file-loader', options: { name: '/node_modules/chrome-aws-lambda/bin/[name].[ext]' } }],
          },
        ],
      },
    }
  })