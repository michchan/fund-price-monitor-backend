const fs = require('fs');
const path = require('path');


const createConfig = (handlersPath) => ({
    mode: 'development',
    target: 'node',
    entry: () => {
        const dirs = fs.readdirSync(handlersPath)
        // Get names of js files
        const names = dirs.filter(dir => {
            const isSubDir = !/(\.js|\.ts)$/.test(dir) 
            if (isSubDir) {
                const subDir = fs.readdirSync(`${handlersPath}/${dir}`)
                // See if there is an index file for this sub directory
                return subDir.filter(n => /^index.js$/.test(n))
            }
            return /\.js$/.test(dir)
        })
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
        path: `${process.cwd()}/${
            handlersPath
                // Replace '/build' with '/bundles' pathname
                .replace(/build/i, 'bundles')
                // Remove "/services"
                .replace(/\/services/i, '')
        }`,
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

// Create config for handlers folder of each service
module.exports = fs.readdirSync(SERVICES_PATH).map(path => createConfig(`${SERVICES_PATH}/${path}/handlers`))

/** Example output */
// module.exports = [
//     createConfig('build/services/cron/handlers'),
//     createConfig('build/services/api/handlers'),
// ];
/** and they will be bundled into: */
// /bundles/cron/handlers
// /bundles/api/handlers