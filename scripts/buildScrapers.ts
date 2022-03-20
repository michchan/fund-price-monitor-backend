/**
 * Dynamically generate lambda handlers of scrapers.
 *
 * This script will take "scrapers" from <scrapersDir> directory,
 * and build lambda 'handlers' under <handlersDir> directory,
 * based on 'templates' under "templateDir" directory.
 *
 * For example:
 * Given there are following files under <scrapersDir>:
 * - aiaMPFScrapers.ts
 * - manulifeMPFScrapers.ts
 *
 * Each of the above scraper files should export the following functions:
 *  - Records scraper: a function named with <recordsHandlerName> in the module, of type:
 * `GetDataWithPage<FundPriceRecord<FundType, RecordType.record>[]>`.
 *  - Details scraper: a function named with <detailsHandlerName> in th e module, of type:
 * `GetDataWithPage<FundDetails[]>`.
 *
 * and the following files under <templateDir>:
 * - scrapeDetails.ts
 * - scrapeRecords.ts
 * - testScrapeDetails.ts
 * - testScrapeRecords.ts
 *
 * The following handler files will be generated under <handlersDir>:
 * - __detailScraper__aiaMPFScrapers.ts
 * - __detailScraper__manulifeMPFScrapers.ts
 * - __recordScraper__aiaMPFScrapers.ts
 * - __recordScraper__manulifeMPFScrapers.ts
 * - __testDetailScraper__aiaMPFScrapers.ts
 * - __testDetailScraper__manulifeMPFScrapers.ts
 * - __testRecordScraper__aiaMPFScrapers.ts
 * - __testRecordScraper__manulifeMPFScrapers.ts
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
const detailsHandlerName = 'scrapeDetails'

const recordsScraperTemplateRegexes = [/^scrapeRecords/i, /^testScrapeRecords/i]
const detailsScraperTemplateRegexes = [/^scrapeDetails/i, /^testScrapeDetails/i]

const removePathExtension = (path: string) => path.replace(/\.(ts|js)/i, '')

const buildByTemplate = (
  templateName: string,
  scraperNames: string[],
  handlerName: string,
  filePrefix: string,
) => {
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
    const importStatment = `import { ${handlerName} } from '${importPath}'`
    // Insert import statements
    const linesWithImports = [
      ...lines.slice(0, lastImportIndex + 1),
      importStatment,
      ...lines.slice(lastImportIndex + 1),
    ]

    // Insert scraper into scrapers array
    const linesWithScraper = linesWithImports.map(line => {
      if (/^const scrapers/i.test(line))
        return line.replace(/=\s\[\]$/i, `= [${handlerName}]`)

      return line
    })
    const linesText = linesWithScraper.join('\n')

    // Write each handler file
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
  templateNames.forEach(templateName => {
    const args = ((): null | [string, string] => {
      const matchName = (regex: RegExp) => regex.test(templateName)
      switch (true) {
        case recordsScraperTemplateRegexes.some(matchName): {
          const prefix = /test/i.test(templateName) ? '__testRecordScraper__' : '__recordScraper__'
          return [recordsHandlerName, prefix]
        }
        case detailsScraperTemplateRegexes.some(matchName): {
          const prefix = /test/i.test(templateName) ? '__testDetailScraper__' : '__detailScraper__'
          return [detailsHandlerName, prefix]
        }
        default:
          return null
      }
    })()
    if (args) buildByTemplate(templateName, scraperNames, ...args)
  })
}

// Run script
buildScrapers()