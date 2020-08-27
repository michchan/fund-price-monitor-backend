import { ScheduledHandler } from "aws-lambda";
import puppeteer = require("puppeteer");

import { FundPriceRecord } from "../../models/fundPriceRecord/FundPriceRecord.type";
import fundPriceRecord from "lib/models/fundPriceRecord";
import isTableOfCurrentQuarter from "lib/models/fundPriceRecord/isTableOfCurrentQuarter";
import scrapeFromManulifeMPF from "./scrapers/scrapeFromManulifeMPF";
import getCurrentQuarter from "lib/helpers/getCurrentQuarter";
import getTableName from "lib/models/fundPriceRecord/getTableName";
import AWS from 'lib/AWS'


// Initialize
const dynamodb = new AWS.DynamoDB();

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
        const quarter = getCurrentQuarter()
        const TableName = getTableName(year, quarter)
        // Passed from the environment variables defined in CDK construct of cron
        const aggregationHandlerArn = process.env.AGGREGATION_HANDLER_ARN as string

        // List tables upon the current quarter
        const tableNames = await fundPriceRecord.listLatestTables();
        // Check if table of the current quarter exists
        if (!tableNames.some(isTableOfCurrentQuarter)) {
            // Create one if it doesn't exist
            await fundPriceRecord.createTable(year, quarter, aggregationHandlerArn)
        }
        // Wait for the table to be active
        await dynamodb.waitFor('tableExists', { TableName }).promise();
        // Write batch data to the table
        await fundPriceRecord.batchCreateItems(records, TableName);
    } catch (error) {
        callback(error)
    }
}