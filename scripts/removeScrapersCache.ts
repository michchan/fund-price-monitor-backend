/**
 * Remove cache files generated by buildScrapers.ts script,
 * sitting under the `handlersDir`.
 * Files with the following prefix under `handlersDir` will be removed:
 * - __recordScraper__
 * - __testRecordScraper__
 */
import fs = require('fs')

const rootDir = __dirname.replace(/\/scripts/i, '')
const handlersDir = 'src/services/cron/handlers'
const handlersDirAbs = `${rootDir}/${handlersDir}`

const regexes = [
  /^__recordScraper__/i,
  /^__detailScraper__/i,
  /^__testRecordScraper__/i,
  /^__testDetailScraper__/i,
]

const removeScrapersCache = () => {
  fs.readdirSync(handlersDirAbs)
    .filter(name => regexes.some(regex => regex.test(name)))
    .forEach(name => fs.unlinkSync(`${handlersDirAbs}/${name}`))
  console.log('Scrape handlers cache REMOVED!')
}

// Run script
removeScrapersCache()