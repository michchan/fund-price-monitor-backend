const fs = require('fs')


const rootDir = __dirname.replace(/\/scripts/i, '')
const scrapersDir = `src/services/cron/scrapers`
const scrapersDirAbs = `${rootDir}/${scrapersDir}`
const templateDir = `src/services/cron/templates`
const templateDirAbs = `${rootDir}/${templateDir}`

const removePathExtension = (path) => path.replace(/\.(ts|js)/i, '')

const buildScrapers = () => {
    // Get names of scrapers
    const scrapers = fs.readdirSync(scrapersDirAbs)
        .map(path => removePathExtension(path))

    // Get import path of scrapers
    const scraperPaths = scrapers.map(path => `${scrapersDir}/${path}`)

    console.log({ scrapers, scraperPaths })

    // Read template paths
    const templatePaths = fs.readdirSync(templateDirAbs)
        .map(path => `${templateDirAbs}/${removePathExtension(path)}`)

    console.log({ templatePaths })
}

// Run script
buildScrapers()