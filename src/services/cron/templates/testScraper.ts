import { ScheduledHandler } from 'aws-lambda'
import { GetDataWithPage } from 'simply-utils/dist/scraping/launchPuppeteerBrowserSession'
import getCurrentYearAndQuarter from 'src/helpers/getCurrentYearAndQuarter'

import FundPriceRecord, { FundType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import saveScrapeMetadata from 'src/models/fundPriceRecord/utils/saveScrapeMetadata'
import scrapeAndReduce from 'src/services/cron/helpers/scrapeAndReduce'
import reduceScrapeMetaInfo from '../../../models/fundPriceRecord/utils/reduceScrapeMetaInfo'
import withStatus from '../helpers/withStatus'

// Create list of scrapers
const scrapers: GetDataWithPage<FundPriceRecord<FundType, 'record'>[]>[] = []
/**
 * Scrape and Create records
 */
export const handler: ScheduledHandler = async () => {
  const [year, quarter] = getCurrentYearAndQuarter()
  const tableRange = { year, quarter }

  const [status, err, records, companies] = await withStatus(() => scrapeAndReduce(scrapers))

  const info = reduceScrapeMetaInfo(records, status, companies)
  await saveScrapeMetadata({ info }, tableRange, 'test')

  if (err) throw err
}