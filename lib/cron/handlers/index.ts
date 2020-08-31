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
        /** ------------ Check table existence and create table ------------ */

        // Get current year and quarter
        const year = new Date().getFullYear()
        const quarter = getQuarter()
        // Get table name based on that year and quarter
        const TableName = fundPriceRecord.getTableName(year, quarter)

        // List tables upon the current quarter
        const tableNames = await fundPriceRecord.listLatestTables();
        // Create a table of the current quarter if it does NOT exist
        if (!tableNames.some(fundPriceRecord.isTableOfCurrentQuarter)) {
            // Get the aggregator ARN Passed from the environment variables defined in CDK construct of cron,
            // to map as dynamodb stream target function
            const aggregationHandlerArn = process.env.AGGREGATION_HANDLER_ARN as string
            // Create one if it doesn't exist
            await fundPriceRecord.createTable(year, quarter, aggregationHandlerArn);
        }

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