import { ScheduledHandler } from "aws-lambda";
import getQuarter from "simply-utils/dist/dateTime/getQuarter";

import fundPriceRecord from "src/models/fundPriceRecord";
import scrapeAll from "../scrapers";
import scrapeFromManulifeMPF from "../scrapers/scrapeFromManulifeMPF";



// Create list of scrapers
const scrapers = [
    scrapeFromManulifeMPF,
]
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
        await fundPriceRecord.batchCreateItems(records, year, quarter, fundPriceRecord.serialize);
    } catch (error) {
        callback(error)
    }
}