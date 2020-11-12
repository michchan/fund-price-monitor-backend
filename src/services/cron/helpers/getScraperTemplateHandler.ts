import { ScheduledHandler } from 'aws-lambda'
import { GetDataWithPage } from 'simply-utils/dist/scraping/launchPuppeteerBrowserSession'

import getCurrentYearAndQuarter from 'src/helpers/getCurrentYearAndQuarter'
import FundPriceRecord, { FundType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import TableRange from 'src/models/fundPriceRecord/TableRange.type'
import reduceScrapeMetaInfo from 'src/models/fundPriceRecord/utils/reduceScrapeMetaInfo'
import saveScrapeMetadata, { MetadataMode } from 'src/models/fundPriceRecord/utils/saveScrapeMetadata'
import scrapeAndReduce, { Output as ScrapeAndReduceOutput } from './scrapeAndReduce'
import withStatus from './withStatus'

type TRec = FundPriceRecord<FundType, 'record'>
export type Callback <T = void> = (
  tableRange: TableRange,
  ...args: ScrapeAndReduceOutput
) => T | Promise<T>

const getScraperTemplateHandler = <T = void> (
  scrapers: GetDataWithPage<TRec[]>[],
  metadataMode: MetadataMode,
  callback?: Callback<T>,
): ScheduledHandler => async () => {
  const [year, quarter] = getCurrentYearAndQuarter()
  const tableRange = { year, quarter }

  const [status, err, records, companies] = await withStatus(async () => {
    // Scrape records from the site
    const output = await scrapeAndReduce(scrapers)
    // Callback to do something with records like saving it into database
    if (callback) await callback(tableRange, ...output)
    return output
  })

  const info = reduceScrapeMetaInfo(records, status, companies)
  await saveScrapeMetadata({ info }, tableRange, metadataMode)

  if (err) throw err
}
export default getScraperTemplateHandler