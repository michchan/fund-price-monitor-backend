import { ScheduledHandler } from "aws-lambda";
import puppeteer = require("puppeteer");

import { FundPriceRecord } from "../../models/fundPriceRecord/FundPriceRecord.type";
import fundPriceRecord from "lib/models/fundPriceRecord";
import isTableOfCurrentQuarter from "lib/models/fundPriceRecord/isTableOfCurrentQuarter";
import scrapeFromManulifeMPF from "./scrapers/scrapeFromManulifeMPF";
import getCurrentQuarter from "lib/helpers/getCurrentQuarter";
import getTableName from "lib/models/fundPriceRecord/getTableName";


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
        
        // Get current year
        const year = new Date().getFullYear()
        const quarter = getCurrentQuarter()
        // List tables upon the current quarter
        const tableNames = await fundPriceRecord.listLatestTables();
        // Check if table of the current quarter exists
        if (!tableNames.some(isTableOfCurrentQuarter)) {
            // Create one if it doesn't exist
            await fundPriceRecord.createTable(year, quarter)
        }
        // Write batch data to the table
        await fundPriceRecord.batchCreateItems(records, getTableName(year, quarter))
    } catch (error) {
        callback(error)
    }
}