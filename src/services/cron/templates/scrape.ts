import { ScheduledHandler } from "aws-lambda"
import { GetDataWithPage } from "simply-utils/dist/scraping/launchPuppeteerBrowserSession"

import { FundPriceRecord } from "src/models/fundPriceRecord/FundPriceRecord.type"
import scrapeAll from "src/services/cron/helpers/scrapeAll"
import batchCreateItems from "src/models/fundPriceRecord/io/batchCreateItems"
import serialize from "src/models/fundPriceRecord/utils/serialize"
import getCurrentYearAndQuarter from "src/helpers/getCurrentYearAndQuarter"

// Create list of scrapers
const scrapers: GetDataWithPage<FundPriceRecord[]>[] = []
/** 
 * Scrape and Create records
 */
export const handler: ScheduledHandler = async (event, context, callback) => {
  try {
    const [year, quarter] = getCurrentYearAndQuarter()

    // Scrape records from the site
    const records = await scrapeAll(scrapers)

    // Write batch data to the table
    await batchCreateItems(records, year, quarter, serialize)
  } catch (error) {
    callback(error)
  }
}
