import launchBrowserSession, { GetDataWithPage } from "./launchBrowserSession"


async function scrapeAll <T> (scrapers: GetDataWithPage<T[]>[]): Promise<T[]> {
  /** ------------ Scrape and Create records ------------ */

  // Scrape records from the site
  const results = await launchBrowserSession<T[]>(scrapers)
  // Flatten records (Array.flat())
  const records = results.reduce((acc, curr) => [...acc, ...curr], [])

  // Throw an error if any of the fields got undefined (not scraped properly)
  for (const rec of records) {
    for (const [key, value] of Object.entries(rec)) {
      if (value === undefined) 
        throw new Error(`${key} undefined from scraped data`)
    }
  }
  // Log records to insert
  console.log(`Records to insert (${records.length}): `, JSON.stringify(records, null, 2))
  return records
}
export default scrapeAll
