import { ScheduledHandler } from 'aws-lambda'
import launchPuppeteerBrowserSession, { GetDataWithPage } from 'simply-utils/dist/scraping/launchPuppeteerBrowserSession'

import getCurrentYearAndQuarter from 'src/helpers/getCurrentYearAndQuarter'
import logObj from 'src/helpers/logObj'
import FundDetails from 'src/models/fundPriceRecord/FundDetails.type'
import TableRange from 'src/models/fundPriceRecord/TableRange.type'

type TRec = FundDetails
export type Callback <T = void> = (
  tableRange: TableRange,
  records: TRec[],
) => T | Promise<T>

const scrapeAndReduce = async (scrapers: GetDataWithPage<TRec[]>[]): Promise<TRec[]> => {
  // Scrape records from the site
  const batches = await launchPuppeteerBrowserSession<TRec[]>(scrapers)
  return batches.reduce((acc, curr) => [...acc, ...curr], [])
}

const getFundsDetailsScraperTemplateHandler = <T = void> (
  scrapers: GetDataWithPage<TRec[]>[],
  callback?: Callback<T>,
): ScheduledHandler => async () => {
  const [year, quarter] = getCurrentYearAndQuarter()
  const tableRange = { year, quarter }

  const records = await scrapeAndReduce(scrapers)
  logObj(`Details records (${records.length})`, records)
  if (callback) await callback(tableRange, records)
}
export default getFundsDetailsScraperTemplateHandler