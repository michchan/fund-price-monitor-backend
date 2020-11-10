import { ScheduledHandler } from 'aws-lambda'
import { GetDataWithPage } from 'simply-utils/dist/scraping/launchPuppeteerBrowserSession'
import logObj from 'src/helpers/logObj'

import { FundPriceRecord, FundType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import scrapeAndReduce from 'src/services/cron/helpers/scrapeAndReduce'
import reduceScrapeMetadata from '../../../models/fundPriceRecord/utils/reduceScrapeMetadata'

// Create list of scrapers
const scrapers: GetDataWithPage<FundPriceRecord<FundType, 'record'>[]>[] = []
/**
 * Scrape and Create records
 */
export const handler: ScheduledHandler = async () => {
  // Scrape records from the site
  const records = await scrapeAndReduce(scrapers)
  const scrapeMeta = reduceScrapeMetadata(records)
  logObj('Scrape meta', scrapeMeta)
}