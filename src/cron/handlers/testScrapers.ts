import { ScheduledHandler } from "aws-lambda";
import getQuarter from "simply-utils/dist/dateTime/getQuarter";

import fundPriceRecord from "src/models/fundPriceRecord";
import scrapeAll from "../scrapers";
import scrapeFromManulifeMPF from "../scrapers/scrapeFromManulifeMPF";
import scrapeFromAIAMPF from "../scrapers/scrapeFromAIAMPF";



// Create list of scrapers
const scrapers = [
    scrapeFromManulifeMPF,
    scrapeFromAIAMPF
]
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