/**
 * Dynamically generate lambda handlers of scrapers.
 *
 * This script will take 'scrapers' from `scrapersDir` directory,
 * and build lambda 'handlers' under `handlersDir` directory,
 * based on 'templates' under `templateDir` directory.
 *
 * For example:
 * Given there are following files under `scrapersDir`:
 * - scrapeFromAIAMPF.ts
 * - scrapeFromManulifeMPF.ts
 *
 * and the following files under `templateDir`:
 * - scrape.ts
 * - testScrapers.ts
 *
 * The following handler files will be generated under `handlersDir`:
 * - handleScrapeFromAIAMPF.ts
 * - handleScrapeFromManulifeMPF.ts
 * - testScrapeFromAIAMPF.ts
 * - testScrapeFromManulifeMPF.ts
 */
const fs = require('fs')

const rootDir = __dirname.replace(/\/scripts/i, '')
const scrapersDir = 'src/services/cron/scrapers'
const scrapersDirAbs = `${rootDir}/${scrapersDir}`
const templateDir = 'src/services/cron/templates'
const templateDirAbs = `${rootDir}/${templateDir}`
const handlersDir = 'src/services/cron/handlers'
const handlersDirAbs = `${rootDir}/${handlersDir}`

const removePathExtension = path => path.replace(/\.(ts|js)/i, '')

const buildScrapers = () => {
  // Get names of scraperNames
  const scraperNames = fs.readdirSync(scrapersDirAbs)
    .map(path => removePathExtension(path))

  // Read template paths
  const templateNames = fs.readdirSync(templateDirAbs)

  // Read each template
  templateNames.forEach(templateName => {
    const template = fs.readFileSync(`${templateDirAbs}/${templateName}`, 'utf8')
    // Split ts file to lines
    const lines = template.split('\n')
    // Find index of last import statement
    const lastImportIndex = lines.reduce((acc, line, index) => {
      if (/^import/i.test(line)) return index
      return acc
    }, 0)

    // Generate file for each scraper
    scraperNames.forEach(name => {
      // Generate import statement
      const importStatment = `import ${name} from '${scrapersDir}/${name}';`
      // Insert import statements
      const linesWithImports = [
        ...lines.slice(0, lastImportIndex + 1),
        importStatment,
        ...lines.slice(lastImportIndex + 1),
      ]

      // Insert scraper into scrapers array
      const linesWithScraper = linesWithImports.map(line => {
        if (/^const scrapers/i.test(line)) return line.replace(/\=\s\[\]$/i, `= [${name}]`)

        return line
      })
      const linesText = linesWithScraper.join('\n')

      // Write each handler file
      const filePrefix = /test/i.test(templateName) ? 'test' : 'handle'
      const nameCapitalized = name.charAt(0).toUpperCase() + name.slice(1)
      const fileName = `${filePrefix}${nameCapitalized}.ts`

      fs.writeFileSync(`${handlersDirAbs}/${fileName}`, linesText)
    })
  })
}

// Run script
buildScrapers()