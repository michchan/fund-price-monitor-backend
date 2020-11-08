import launchPuppeteerBrowserSession, {
  GetDataWithPage,
} from 'simply-utils/dist/scraping/launchPuppeteerBrowserSession'

import logObj from 'src/helpers/logObj'
import { FundPriceRecord, FundType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import takeUpdatedRecords from 'src/models/fundPriceRecord/utils/takeUpdatedRecords'

type RT = FundPriceRecord<FundType, 'record'>

const validateRecords = (records: RT[]): void => {
  // Throw an error if any of the fields got undefined (not scraped properly)
  for (const rec of records) {
    for (const [key, value] of Object.entries(rec))
      if (value === undefined) throw new Error(`${key} undefined from scraped data`)
  }
}

const reduceRecords = (batches: RT[][]): Promise<RT[]> => {
  // Flatten records (Array.flat())
  const records = batches.reduce((acc, curr) => [...acc, ...curr], [])
  logObj(`Records scraped (${records.length}): `, records)
  return takeUpdatedRecords(records)
}

async function scrapeAll (scrapers: GetDataWithPage<RT[]>[]): Promise<RT[]> {
  // Scrape records from the site
  const batches = await launchPuppeteerBrowserSession<RT[]>(scrapers)
  const records = await reduceRecords(batches)
  validateRecords(records)
  logObj(`Records to insert (${records.length}): `, records)
  return records
}
export default scrapeAll