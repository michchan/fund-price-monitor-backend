/**
 * Dynamically generate lambda handlers of scrapers.
 *
 * This script will take "scrapers" from "scrapersDir" directory,
 * and build lambda 'handlers' under `handlersDir` directory,
 * based on 'templates' under "templateDir" directory.
 *
 * For example:
 * Given there are following files under "scrapersDir":
 * - scrapeFromAIAMPF.ts
 * - scrapeFromManulifeMPF.ts
 * Each of the above scraper files should export
 * a function "recordsHandlerName" in the module, of type:
 * `GetDataWithPage<FundPriceRecord<FundType, 'record'>[]>`.
 *
 * and the following files under "templateDir":
 * - scrapeRecords.ts
 * - testScraperRecords.ts
 *
 * The following handler files will be generated under "handlersDir":
 * - handleScrapeFromAIAMPF.ts
 * - handleScrapeFromManulifeMPF.ts
 * - testScrapeFromAIAMPF.ts
 * - testScrapeFromManulifeMPF.ts
 */
import fs = require('fs')

const rootDir = __dirname.replace(/\/scripts/i, '')
const scrapersDir = 'src/services/cron/scrapers'
const scrapersDirAbs = `${rootDir}/${scrapersDir}`
const templateDir = 'src/services/cron/templates'
const templateDirAbs = `${rootDir}/${templateDir}`
const handlersDir = 'src/services/cron/handlers'
const handlersDirAbs = `${rootDir}/${handlersDir}`
const recordsHandlerName = 'scrapeRecords'

const removePathExtension = (path: string) => path.replace(/\.(ts|js)/i, '')

const buildByTemplate = (templateName: string, scraperNames: string[]) => {
  const template = fs.readFileSync(`${templateDirAbs}/${templateName}`, 'utf8')
  // Split ts file to lines
  const lines = template.split('\n')

  // Find index of last import statement
  const lastImportIndex = lines.reduce((acc: number, line, index) => {
    if (/^import/i.test(line)) return index
    return acc
  }, 0)

  // Generate file for each scraper
  scraperNames.forEach(name => {
    // Generate import statement
    const importPath = `${scrapersDir}/${name}`
    const importStatment = `import { ${recordsHandlerName} } from '${importPath}'`
    // Insert import statements
    const linesWithImports = [
      ...lines.slice(0, lastImportIndex + 1),
      importStatment,
      ...lines.slice(lastImportIndex + 1),
    ]

    // Insert scraper into scrapers array
    const linesWithScraper = linesWithImports.map(line => {
      if (/^const scrapers/i.test(line))
        return line.replace(/=\s\[\]$/i, `= [${recordsHandlerName}]`)

      return line
    })
    const linesText = linesWithScraper.join('\n')

    // Write each handler file
    const filePrefix = /test/i.test(templateName) ? '__testScraper__' : '__scraper__'
    const fileName = `${filePrefix}${name}.ts`

    fs.writeFileSync(`${handlersDirAbs}/${fileName}`, linesText)
  })
}

const buildScrapers = () => {
  // Get names of scraperNames
  const scraperNames = fs
    .readdirSync(scrapersDirAbs)
    .map(path => removePathExtension(path))
  // Read template paths
  const templateNames = fs.readdirSync(templateDirAbs)
  // Read each template
  templateNames.forEach(templateName => buildByTemplate(templateName, scraperNames))
}

// Run script
buildScrapers()