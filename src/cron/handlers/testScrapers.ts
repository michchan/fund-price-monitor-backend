import { ScheduledHandler } from "aws-lambda";

import { FundPriceRecord } from "../../models/fundPriceRecord/FundPriceRecord.type";
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
    
        console.log(`RESULTS: `, JSON.stringify(results, null, 2))
        console.log(`RECORDS: `, JSON.stringify(records, null, 2))
    } catch (error) {
        callback(error)
    }
}