import launchPuppeteerBrowserSession, {
  GetDataWithPage,
} from 'simply-utils/dist/scraping/launchPuppeteerBrowserSession'
import { FundPriceRecord, CompanyType, FundType, RecordType } from '@michchan/fund-price-monitor-lib'

import logObj from 'src/helpers/logObj'
import getCompaniesFromRecords from 'src/models/fundPriceRecord/utils/getCompaniesFromRecords'
import getInvalidRecordFields from 'src/models/fundPriceRecord/utils/getInvalidRecordFields'
import takeUpdatedRecords from 'src/models/fundPriceRecord/utils/takeUpdatedRecords'

const SCRAPER_TIMEOUT = 600_000

type RT = FundPriceRecord<FundType, RecordType.record>

const validateRecords = (records: RT[]): void => {
  // Throw an error if any of the fields got undefined (not scraped properly)
  for (const rec of records) {
    const invalidFields = getInvalidRecordFields(rec)
    if (invalidFields.length > 0)
      throw new Error(`Invalid fields from scraped data: ${invalidFields.join(', ')}`)
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
  const batches = await launchPuppeteerBrowserSession<RT[]>(scrapers, SCRAPER_TIMEOUT)
  const [records, companies] = await reduceRecords(batches)
  validateRecords(records)
  logObj('Records to insert', records)
  return [records, companies]
}
export default scrapeAndReduceRecords