import { ScheduledHandler } from "aws-lambda";
import getQuarter from "simply-utils/dist/dateTime/getQuarter";

import scrapeAll from "../scrapers";
import batchCreateItems from "src/models/fundPriceRecord/io/batchCreateItems";
import serialize from "src/models/fundPriceRecord/utils/serialize";

import scrapeFromManulifeMPF from "../scrapers/scrapeFromManulifeMPF";
import scrapeFromAIAMPF from "../scrapers/scrapeFromAIAMPF";


// Create list of scrapers
const scrapers = [
    scrapeFromManulifeMPF,
    scrapeFromAIAMPF,
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
        await batchCreateItems(records, year, quarter, serialize);
    } catch (error) {
        callback(error)
    }
}