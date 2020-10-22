import launchPuppeteerBrowserSession, {
  GetDataWithPage,
} from 'simply-utils/dist/scraping/launchPuppeteerBrowserSession'
import logObj from 'src/helpers/logObj'

async function scrapeAll <T> (scrapers: GetDataWithPage<T[]>[]): Promise<T[]> {
  /** ------------ Scrape and Create records ------------ */

  // Scrape records from the site
  const results = await launchPuppeteerBrowserSession<T[]>(scrapers)
  // Flatten records (Array.flat())
  const records = results.reduce((acc, curr) => [...acc, ...curr], [])

  // Throw an error if any of the fields got undefined (not scraped properly)
  for (const rec of records) {
    for (const [key, value] of Object.entries(rec))
      if (value === undefined) throw new Error(`${key} undefined from scraped data`)
  }
  // Log records to insert
  logObj(`Records to insert (${records.length}): `, records)
  return records
}
export default scrapeAll