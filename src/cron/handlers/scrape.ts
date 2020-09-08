import { ScheduledHandler } from "aws-lambda";
import getQuarter from "simply-utils/dist/dateTime/getQuarter";

import { FundPriceRecord } from "../../models/fundPriceRecord/FundPriceRecord.type";
import fundPriceRecord from "src/models/fundPriceRecord";
import scrapeFromManulifeMPF from "../scrapers/scrapeFromManulifeMPF";



// Create list of scrapers
const scrapers: (() => Promise<FundPriceRecord[]>)[] = [
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
        const results = await Promise.all(scrapers.map(scrape => scrape()))
        // Merge records
        const records = results.reduce((acc, curr) => [...acc, ...curr], [])

        // Throw an error if any of the fields got undefined (not scraped properly)
        for (const rec of records) {
            for (const [key, value] of Object.entries(rec)) {
                if (value === undefined) 
                    throw new Error(`${key} undefined from scraped data`)
            }
        }
    
        // Log records to insert
        console.log(`Records to insert (${records.length}): `, JSON.stringify(records, null, 2));
        // Write batch data to the table
        await fundPriceRecord.batchCreateItems(records, year, quarter, fundPriceRecord.serialize);
    } catch (error) {
        callback(error)
    }
}