import { ScheduledHandler } from 'aws-lambda'
import { GetDataWithPage } from 'simply-utils/dist/scraping/launchPuppeteerBrowserSession'

import getCurrentYearAndQuarter from 'src/helpers/getCurrentYearAndQuarter'
import { FundPriceRecord, FundType, RecordType } from '@michchan/fund-price-monitor-lib'
import TableRange from 'src/models/fundPriceRecord/TableRange.type'
import reduceScrapeMetaInfo from 'src/models/fundPriceRecord/utils/reduceScrapeMetaInfo'
import saveScrapeMetadata, { MetadataMode } from 'src/models/fundPriceRecord/utils/saveScrapeMetadata'
import scrapeAndReduceRecords, { Output as ScrapeAndReduceRecordOutput } from './scrapeAndReduceRecords'
import withStatus from './withStatus'

type TRec = FundPriceRecord<FundType, RecordType.record>
export type Callback <T = void> = (
  tableRange: TableRange,
  ...args: ScrapeAndReduceRecordOutput
) => T | Promise<T>

const getRecordsScraperTemplateHandler = <T = void> (
  scrapers: GetDataWithPage<TRec[]>[],
  metadataMode: MetadataMode,
  callback?: Callback<T>,
): ScheduledHandler => async () => {
  const [year, quarter] = getCurrentYearAndQuarter()
  const tableRange = { year, quarter }

  const [status, err, records, companies] = await withStatus(async () => {
    // Scrape records from the site
    const output = await scrapeAndReduceRecords(scrapers)
    // Callback to do something with records like saving it into database
    if (callback) await callback(tableRange, ...output)
    return output
  })

  const info = reduceScrapeMetaInfo(records, status, companies)
  await saveScrapeMetadata({ info }, tableRange, metadataMode)

  if (err) throw err
}
export default getRecordsScraperTemplateHandler