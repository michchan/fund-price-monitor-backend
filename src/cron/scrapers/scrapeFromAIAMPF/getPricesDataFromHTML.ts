import puppeteer = require("puppeteer");

import { FundPriceRecord } from "src/models/fundPriceRecord/FundPriceRecord.type"
import getIDFromAnchorTag from "./getIDFromAnchorTag";


export interface PriceDataRecord extends Pick<FundPriceRecord, 
    | 'code'
    | 'name'
    | 'price'
    | 'updatedDate'
> {}
/**
 * Helpers to query the prices data from html
 */
const getPricesDataFromHTML = async (page: puppeteer.Page): Promise<PriceDataRecord[]> => {
    // Wait for the elements we want
    await page.waitForSelector('#fundpriceslist > table > tbody > tr:not(.header):last-child > td');

    // Query DOM data
    // * Constants/variables must be inside the scope of the callback function
    return page.evaluate((): PriceDataRecord[] => {
        // Query table rows nodes
        const tableRows: NodeListOf<HTMLTableRowElement> = document.querySelectorAll('#fundpriceslist > table > tbody > tr:not(.header)');

        // Get page-level updatedDate
        const updatedDateEl = document.querySelector('#main-block > table > tbody > tr > td > font') as HTMLFontElement;
        const [all, year, month, date] = (updatedDateEl?.innerText ?? '').match(/(\d{4})年(\d{1,2})月(\d{1,2})/i) ?? ''
        const MM = +month < 10 ? `0${month}` : month
        const DD = +date < 10 ? `0${date}` : date
        const updatedDate = `${year}-${MM}-${DD}`

        // Map table rows data to PriceDataRecord[]
        return Array.from(tableRows)
            // Filter out that some funds might not have a unit price
            .filter(row => row.children.length === 3)
            .map((row): PriceDataRecord => {
                // Get table cells list
                const dataCells = row.children as HTMLCollectionOf<HTMLTableDataCellElement>
                // Get ID from the url of the item
                const anchor = dataCells[0].children[0] as HTMLAnchorElement
                // ID Getter
                const getIDFromAnchorTag = (anchor: HTMLAnchorElement): string => {
                    const matches = (anchor?.href ?? '').match(/id=(.+)$/i) ?? []
                    return (matches[1] ?? '').trim()
                }

                return {
                    code: getIDFromAnchorTag(anchor),
                    name: dataCells[0].innerText.trim(),
                    price: +dataCells[2].innerText.trim(),
                    updatedDate,
                }
            })
    })
}
export default getPricesDataFromHTML