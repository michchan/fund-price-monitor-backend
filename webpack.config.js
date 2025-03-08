const fs = require('fs')
const { createConfig, createBundleAnalyzerPlugin, chromeAWSLambdaRules } = require('@michchan/webpack-config-aws-cdk')
const { omit } = require('lodash')

require('dotenv').config()

const isBundleAnalyzerEnabled = /^true$/i.test(process.env.BUNDLE_ANALYZER_ENABLED || '')

// Services directory path
const SERVICES_PATH_INPUT = 'build/src/services'
const SERVICES_PATH_OUTPUT = 'bundles'
const SRC_ALIAS_OUTPUT = 'build/src'
const DEFAULT_ANALYZER_PORT = 8888

// Create config for handlers folder of each service
module.exports = fs.readdirSync(SERVICES_PATH_INPUT)
  .map((path, i) => {
    const inputPath = `${SERVICES_PATH_INPUT}/${path}/handlers`
    const outputPath = `${SERVICES_PATH_OUTPUT}/${path}/handlers`
    const defaultConfig = createConfig(inputPath, outputPath, __dirname, SRC_ALIAS_OUTPUT)
    return {
      ...defaultConfig,
      plugins: isBundleAnalyzerEnabled
        ? [createBundleAnalyzerPlugin(path, DEFAULT_ANALYZER_PORT + i)]
        : [],
      module: {
        rules: chromeAWSLambdaRules,
      },
      /**
       * Aws-sdk v2 is needed to be bundled explicitly on Nodejs 18.x onwards.
       * Remove this when the project upgrades aws-sdk to v3.
       * Reference: https://aws.amazon.com/blogs/compute/node-js-18-x-runtime-now-available-in-aws-lambda/
       */
      externals: omit(defaultConfig.externals, 'aws-sdk'),
    }
  })