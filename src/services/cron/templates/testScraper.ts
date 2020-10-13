import { ScheduledHandler } from "aws-lambda"
import { FundPriceRecord } from "src/models/fundPriceRecord/FundPriceRecord.type"
import { GetDataWithPage } from "../helpers/launchBrowserSession"

import scrapeAll from "src/services/cron/helpers/scrapeAll"

// Create list of scrapers
const scrapers: GetDataWithPage<FundPriceRecord[]>[] = []
/** 
 * Scrape and Create records
 */
export const handler: ScheduledHandler = async (event, context, callback) => {
    try {
        // Scrape records from the site
        await scrapeAll(scrapers)
    } catch (error) {
        callback(error)
    }
}