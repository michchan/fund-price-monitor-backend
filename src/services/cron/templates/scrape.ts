import { ScheduledHandler } from 'aws-lambda'
import { GetDataWithPage } from 'simply-utils/dist/scraping/launchPuppeteerBrowserSession'

import { FundPriceRecord, FundType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import scrapeAndReduce from 'src/services/cron/helpers/scrapeAndReduce'
import batchCreateItems from 'src/models/fundPriceRecord/io/batchCreateItems'
import serialize from 'src/models/fundPriceRecord/utils/serialize'
import getCurrentYearAndQuarter from 'src/helpers/getCurrentYearAndQuarter'

// Create list of scrapers
const scrapers: GetDataWithPage<FundPriceRecord<FundType, 'record'>[]>[] = []
/**
 * Scrape and Create records
 */
export const handler: ScheduledHandler = async () => {
  const [year, quarter] = getCurrentYearAndQuarter()
  const tableRange = { year, quarter }
  // Scrape records from the site
  const records = await scrapeAndReduce(scrapers)
  // Write batch data to the table
  await batchCreateItems(records, tableRange, serialize)
}