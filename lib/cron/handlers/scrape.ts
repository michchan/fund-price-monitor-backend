import { ScheduledHandler } from "aws-lambda";

import { FundPriceRecord } from "../../models/fundPriceRecord/FundPriceRecord.type";
import fundPriceRecord from "lib/models/fundPriceRecord";
import scrapeFromManulifeMPF from "./scrapers/scrapeFromManulifeMPF";
import getQuarter from "lib/helpers/getQuarter";



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
        // Get table name based on that year and quarter
        const TableName = fundPriceRecord.getTableName(year, quarter)

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
    
        // Write batch data to the table
        await fundPriceRecord.batchCreateItems(records, TableName);
    } catch (error) {
        callback(error)
    }
}