import puppeteer = require("puppeteer");

import { FundPriceRecord } from "src/models/fundPriceRecord/FundPriceRecord.type"


export interface DetailsDataRecord extends Pick<FundPriceRecord, 
    | 'code'
    | 'riskLevel'
> {}

/**
* Helpers to query the details data from html
*/
const getDetailsDataFromHTML = async (page: puppeteer.Page): Promise<DetailsDataRecord[]> => {
    // Wait for the elements we want
    await page.waitForSelector(`#funddetails_list > table > tbody > tr:not(.header):last-child > td`);

    // Query DOM data
    // * Constants/variables must be inside the scope of the callback function
    return page.evaluate((): DetailsDataRecord[] => {
        return []
    })
}
export default getDetailsDataFromHTML