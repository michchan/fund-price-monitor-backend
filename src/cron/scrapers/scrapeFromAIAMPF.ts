import puppeteer = require("puppeteer");
import zeroPadding from "simply-utils/dist/number/zeroPadding";

import { FundPriceRecord, CompanyType, FundType, RecordType } from "src/models/fundPriceRecord/FundPriceRecord.type"
import { scrapeFromLink } from "../helpers/scrapeFromLink";


const PRICES_PAGE_URL = 'https://www3.aia-pt.com.hk/MPF/ch/fund/prices/'
const PERFORMANCE_PAGE_URL = 'https://www3.aia-pt.com.hk/MPF/ch/fund/performance/'
const INFO_PAGE_URL = 'https://www3.aia-pt.com.hk/MPF/ch/fund/details/'


const scrapeFromAIAMPF = async (): Promise<FundPriceRecord[]> => {
    // Define company type
    const company: CompanyType = 'manulife'
    // Define fundType
    const fundType: FundType = 'mpf'
    // Define record type
    const recordType: RecordType = 'record'
    // Define time
    const time: FundPriceRecord['time'] = new Date().toISOString();

    // Scrape prices data page
    const pricesData = await scrapeFromLink(PRICES_PAGE_URL, getPricesDataFromHTML);
    console.log('pricesData: ', JSON.stringify(pricesData, null, 2))

    return []
}
export default scrapeFromAIAMPF


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
    // Query DOM data
    // * Constants/variables must be inside the scope of the callback function
    return page.evaluate((function (): PriceDataRecord[] {
        // Query table rows nodes
        const tableRows: NodeListOf<HTMLTableRowElement> = document.querySelectorAll('#fundpriceslist > table > tbody > tr:not(.header)');

        // Get page-level updatedDate
        const updatedDateEl = document.querySelector('#main-block > table > tbody > tr > td > font') as HTMLFontElement;
        const [all, year, month, date] = (updatedDateEl?.innerText ?? '').match(/(\d{4})年(\d{1,2})月(\d{1,2})/i) ?? ''
        const updatedDate = `${year}-${zeroPadding(+month, 2)}=${zeroPadding(+date, 2)}`

        // Map table rows data to PriceDataRecord[]
        return Array.from(tableRows)
            // Filter out that some funds might not have a unit price
            .filter(row => row.children.length === 3)
            .map((row): PriceDataRecord => {
                // Get table cells list
                const dataCells = row.children as HTMLCollectionOf<HTMLTableDataCellElement>
                // Get ID from the url of the item
                const anchor = dataCells[0].children[0] as HTMLAnchorElement
                const matches = (anchor?.href ?? '').match(/id=(.+)$/i) ?? []

                return {
                    code: (matches[1] ?? '').trim(),
                    name: dataCells[0].innerText.trim(),
                    price: +dataCells[2].innerText.trim(),
                    updatedDate,
                }
            })
    }).bind({ zeroPadding }))
}