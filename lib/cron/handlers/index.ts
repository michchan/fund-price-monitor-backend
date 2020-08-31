import { ScheduledHandler } from "aws-lambda";

import { FundPriceRecord } from "../../models/fundPriceRecord/FundPriceRecord.type";
import fundPriceRecord from "lib/models/fundPriceRecord";
import scrapeFromManulifeMPF from "./scrapers/scrapeFromManulifeMPF";
import getQuarter from "lib/helpers/getQuarter";



// Create list of scrapers
const scrapers: (() => Promise<FundPriceRecord[]>)[] = [
    scrapeFromManulifeMPF,
]

export const handler: ScheduledHandler = async (event, context, callback) => {
    try {
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
        
        // Get current year
        const year = new Date().getFullYear()
        const quarter = getQuarter()
        const TableName = fundPriceRecord.getTableName(year, quarter)
        // Passed from the environment variables defined in CDK construct of cron
        const aggregationHandlerArn = process.env.AGGREGATION_HANDLER_ARN as string

        // List tables upon the current quarter
        const tableNames = await fundPriceRecord.listLatestTables();
        // Check if table of the current quarter exists
        if (!tableNames.some(fundPriceRecord.isTableOfCurrentQuarter)) {
            // Create one if it doesn't exist
            await fundPriceRecord.createTable(year, quarter, aggregationHandlerArn);
            // @TODO: Remove this, testing only
            return
        }
        // Write batch data to the table
        await fundPriceRecord.batchCreateItems(records, TableName);
    } catch (error) {
        callback(error)
    }
}