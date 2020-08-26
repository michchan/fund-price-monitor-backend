import { ScheduledHandler } from "aws-lambda";
import puppeteer = require("puppeteer");

import { FundPriceRecord } from "../../models/fundPriceRecord/FundPriceRecord.type";
import fundPriceRecord from "lib/models/fundPriceRecord";
import isTableOfCurrentQuarter from "lib/models/fundPriceRecord/isTableOfCurrentQuarter";
import scrapeFromManulifeMPF from "./scrapers/scrapeFromManulifeMPF";
import getCurrentQuarter from "lib/helpers/getCurrentQuarter";


// Create list of scrapers
const scrapers: (() => Promise<FundPriceRecord[]>)[] = [
    scrapeFromManulifeMPF,
]

export const handler: ScheduledHandler = async (event, context, callback) => {
    try {
        // Scrape records from the site
        const results = await Promise.all(scrapers.map(scrape => scrape()))
        const records = results.reduce((acc, curr) => [...acc, ...curr], [])
        console.log({ records })
        // List tables upon the current quarter
        const tableNames = await fundPriceRecord.listLatestTables();
        console.log({ tableNames })
        // Check if table of the current quarter exists
        if (!tableNames.some(isTableOfCurrentQuarter)) {
            console.log('Current quarter\'s table not exist! Creating one...')
            // Create one if it doesn't exist
            await fundPriceRecord.createTable(new Date().getFullYear(), getCurrentQuarter())
        }
        // Write bulk data to the table
        
    } catch (error) {
        callback(error)
    }
}