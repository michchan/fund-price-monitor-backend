import { ScheduledHandler } from "aws-lambda";
import { FundPriceRecord } from "src/models/fundPriceRecord/FundPriceRecord.type";
import { GetDataWithPage } from "../helpers/launchBrowserSession";
import getQuarter from "simply-utils/dist/dateTime/getQuarter";

import scrapeAll from "src/services/cron/helpers/scrapeAll";
import batchCreateItems from "src/models/fundPriceRecord/io/batchCreateItems";
import serialize from "src/models/fundPriceRecord/utils/serialize";


// Create list of scrapers
const scrapers: GetDataWithPage<FundPriceRecord[]>[] = []
/** 
 * Scrape and Create records
 */
export const handler: ScheduledHandler = async (event, context, callback) => {
    try {
        // Get current year and quarter
        const year = new Date().getFullYear()
        const quarter = getQuarter()
        
        /** ------------ Scrape and Create records ------------ */

        // Scrape records from the site
        const records = await scrapeAll(scrapers)

        // Write batch data to the table
        await batchCreateItems(records, year, quarter, serialize);
    } catch (error) {
        callback(error)
    }
}