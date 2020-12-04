import launchPuppeteerBrowserSession, {
  GetDataWithPage,
} from 'simply-utils/dist/scraping/launchPuppeteerBrowserSession'

import logObj from 'src/helpers/logObj'
import FundPriceRecord, { CompanyType, FundType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import getCompaniesFromRecords from 'src/models/fundPriceRecord/utils/getCompaniesFromRecords'
import takeUpdatedRecords from 'src/models/fundPriceRecord/utils/takeUpdatedRecords'

type RT = FundPriceRecord<FundType, 'record'>

const validateRecords = (records: RT[]): void => {
  // Throw an error if any of the fields got undefined (not scraped properly)
  for (const rec of records) {
    for (const [key, value] of Object.entries(rec))
      if (value === undefined) throw new Error(`${key} undefined from scraped data`)
  }
}

export type Output = [RT[], CompanyType[]]
const reduceRecords = async (batches: RT[][]): Promise<Output> => {
  // Flatten records (Array.flat())
  const records = batches.reduce((acc, curr) => [...acc, ...curr], [])
  const companies = getCompaniesFromRecords(records)
  logObj('Records scraped', records)
  logObj('Companies derived from scraped records', companies)
  const takenRecords = await takeUpdatedRecords(records)
  return [takenRecords, companies]
}

async function scrapeAndReduceRecords (scrapers: GetDataWithPage<RT[]>[]): Promise<Output> {
  // Scrape records from the site
  const batches = await launchPuppeteerBrowserSession<RT[]>(scrapers)
  const [records, companies] = await reduceRecords(batches)
  validateRecords(records)
  logObj('Records to insert', records)
  return [records, companies]
}
export default scrapeAndReduceRecords