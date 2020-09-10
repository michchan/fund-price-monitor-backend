import puppeteer = require("puppeteer");

import { FundPriceRecord } from "src/models/fundPriceRecord/FundPriceRecord.type"
import getIDFromAnchorTag from "./getIDFromAnchorTag";


export interface PerfDataRecord extends Pick<FundPriceRecord, 
    | 'code'
    | 'launchedDate'
> {
    priceChangeRateSinceLaunch: number;
}

/**
* Helpers to query the performance data from html
*/
const getPerformanceDataFromHTML = async (page: puppeteer.Page): Promise<PerfDataRecord[]> => {
    // Wait for the elements we want
    await page.waitForSelector('#fundpriceslist > table > tbody > tr:not(.header):last-child > td');

    // Query DOM data
    // * Constants/variables must be inside the scope of the callback function
    return page.evaluate((): PerfDataRecord[] => {
        // Query table rows nodes
        const tableRows: NodeListOf<HTMLTableRowElement> = document.querySelectorAll('#fundpriceslist > table > tbody > tr:not(.header)');

        // Map table rows data to PerfDataRecord[]
        return Array.from(tableRows)
            .map((row): PerfDataRecord => {
                // Get table cells list
                const dataCells = row.children as HTMLCollectionOf<HTMLTableDataCellElement>
                // Get ID from the url of the item
                const anchor = dataCells[0].children[0] as HTMLAnchorElement

                return {
                    code: getIDFromAnchorTag(anchor),
                    launchedDate: dataCells[1].innerText.trim(),
                    priceChangeRateSinceLaunch: Number(dataCells[7].innerText.trim()),
                }
            })
    })
}
export default getPerformanceDataFromHTML