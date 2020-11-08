import { ScheduledHandler } from 'aws-lambda'
import { GetDataWithPage } from 'simply-utils/dist/scraping/launchPuppeteerBrowserSession'

import { FundPriceRecord, FundType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import scrapeAndReduce from 'src/services/cron/helpers/scrapeAndReduce'

// Create list of scrapers
const scrapers: GetDataWithPage<FundPriceRecord<FundType, 'record'>[]>[] = []
/**
 * Scrape and Create records
 */
export const handler: ScheduledHandler = async () => {
  // Scrape records from the site
  await scrapeAndReduce(scrapers)
}