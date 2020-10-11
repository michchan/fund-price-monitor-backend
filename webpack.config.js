const fs = require('fs');
const path = require('path');


const createConfig = (handlersPath) => ({
    mode: 'development',
    target: 'node',
    entry: () => {
        const dirs = fs.readdirSync(handlersPath)
        // Get names of js files
        const names = dirs.filter(dir => /\.js$/.test(dir))
        // Map entry object
        return names.reduce((obj, name) => {
            // Remove .js file extension
            const key = name.replace(/\.js$/, '')
            // Append 'index.js' if it is a directory
            const filePath = !/\.js$/.test(name) ? `${name}/index.js` : name
            
            return { 
                ...obj, 
                [key]: `./${handlersPath}/${filePath}` 
            }
        }, {})
    },
    output: {
        path: `${process.cwd()}/${handlersPath.replace(/build/i, 'bundles')}`,
        // Keep the bundle name same as the orignal function name
        filename: `[name].js`,
        libraryTarget: 'umd'
    },
    node: {
        // Make sure that __dirname works in node env
        __dirname: true,
    },
    module: {
        rules: [
          /**
           * Use file loader to move chromium .br files into /bin
           * @link https://github.com/alixaxel/chrome-aws-lambda/issues/80
           */
          {
            test: /chrome\-aws\-lambda\/bin\/(.+)\.br$/,
            use: [{ loader: 'file-loader', options: { name: '/node_modules/chrome-aws-lambda/bin/[name].[ext]' } }],
          },
        ],
    },
    resolve: {
        alias: {
            src: path.resolve(__dirname, 'build')
        }
    }
})

// Services directory path
const SERVICES_PATH = `build/services`

// Create config for each service folder
module.exports = fs.readdirSync(SERVICES_PATH).map(path => createConfig(`${SERVICES_PATH}/${path}`))

/** Example output */
// module.exports = [
//     createConfig('build/cron/handlers'),
//     createConfig('build/api/handlers'),
// ];