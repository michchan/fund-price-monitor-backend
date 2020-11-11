import { ScheduledHandler } from 'aws-lambda'
import { GetDataWithPage } from 'simply-utils/dist/scraping/launchPuppeteerBrowserSession'
import getCurrentYearAndQuarter from 'src/helpers/getCurrentYearAndQuarter'

import { FundPriceRecord, FundType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import saveScrapeMetadata from 'src/models/fundPriceRecord/utils/saveScrapeMetadata'
import scrapeAndReduce from 'src/services/cron/helpers/scrapeAndReduce'
import reduceScrapeMetadata from '../../../models/fundPriceRecord/utils/reduceScrapeMetadata'
import withStatus from '../helpers/withStatus'

// Create list of scrapers
const scrapers: GetDataWithPage<FundPriceRecord<FundType, 'record'>[]>[] = []
/**
 * Scrape and Create records
 */
export const handler: ScheduledHandler = async () => {
  const [year, quarter] = getCurrentYearAndQuarter()
  const tableRange = { year, quarter }

  const [status, err, records] = await withStatus(() => scrapeAndReduce(scrapers))

  const scrapeMeta = reduceScrapeMetadata(records, status)
  await saveScrapeMetadata(scrapeMeta, tableRange, 'test')

  if (err) throw err
}