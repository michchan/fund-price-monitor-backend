import puppeteer = require("puppeteer");

import { FundPriceRecord } from "src/models/fundPriceRecord/FundPriceRecord.type"


export interface PerfDataRecord extends Pick<FundPriceRecord, 
    | 'code'
    | 'launchedDate'
> {
    priceChangeRateFromLaunch: number;
}

/**
* Helpers to query the performance data from html
*/
const getPerformanceDataFromHTML = async (page: puppeteer.Page): Promise<PerfDataRecord[]> => {
    // Wait for the elements we want
    await page.waitForSelector('#fundpriceslist > table > tbody > tr:last-child > td');

    // Query DOM data
    // * Constants/variables must be inside the scope of the callback function
    return page.evaluate((): PerfDataRecord[] => {
        return []
    })
}
export default getPerformanceDataFromHTML