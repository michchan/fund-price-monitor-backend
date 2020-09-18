import puppeteer = require("puppeteer");

import { FundPriceRecord, CompanyType, FundType, RecordType } from "src/models/fundPriceRecord/FundPriceRecord.type"
import getPricesDataFromHTML from "./getPricesDataFromHTML";
import getPerformanceDataFromHTML from "./getPerformanceDataFromHTML";
import getDetailsDataFromHTML from "./getDetailsDataFromHTML";


const PRICES_PAGE_URL = 'https://www3.aia-pt.com.hk/mpf/public/fundperf/fundprices.jspa?mt=MT3&lang=zh_TW'
const PERFORMANCE_PAGE_URL = 'https://www3.aia-pt.com.hk/mpf/public/fundperf/fundperf.jspa?mt=MT3&lang=zh_TW'
const DETAILS_PAGE_URL = 'https://www3.aia-pt.com.hk/mpf/public/fundperf/funddetails.jspa?mt=MT3&lang=zh_TW'


const scrapeFromAIAMPF = async (page: puppeteer.Page): Promise<FundPriceRecord[]> => {
    // Define company type
    const company: CompanyType = 'manulife'
    // Define fundType
    const fundType: FundType = 'mpf'
    // Define record type
    const recordType: RecordType = 'record'
    // Define time
    const time: FundPriceRecord['time'] = new Date().toISOString();

    // Scrape prices data page
    await page.goto(PRICES_PAGE_URL);
    const pricesData = await getPricesDataFromHTML(page);

    // Scrape performance data page
    await page.goto(PERFORMANCE_PAGE_URL)
    const perfData = await getPerformanceDataFromHTML(page);

    // Scrape details page
    await page.goto(DETAILS_PAGE_URL)
    const detailsData = await getDetailsDataFromHTML(page);

    // Aggregate data
    
    console.log(`pricesData (length: ${pricesData.length}): `, JSON.stringify(pricesData, null, 2));
    console.log(`perfData (length: ${perfData.length}): `, JSON.stringify(perfData, null, 2));
    console.log(`detailsData (length: ${detailsData.length}): `, JSON.stringify(detailsData, null, 2));

    return []
}
export default scrapeFromAIAMPF