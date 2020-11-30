const fs = require('fs')
const { createConfig, createBundleAnalyzerPlugin, chromeAWSLambdaRules } = require('@michchan/webpack-config-aws-cdk')

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
        rules: chromeAWSLambdaRules,
      },
    }
  })