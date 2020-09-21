import puppeteer = require("puppeteer");

import { FundPriceRecord, CompanyType, FundType, RecordType } from "src/models/fundPriceRecord/FundPriceRecord.type"
import getPricesData from "./getPricesData";
import getPerformanceData from "./getPerformanceData";
import getDetailsData from "./getDetailsData";


const PRICES_PAGE_URL = 'https://www3.aia-pt.com.hk/mpf/public/fundperf/fundprices.jspa?mt=MT3&lang=zh_TW'
const PERFORMANCE_PAGE_URL = 'https://www3.aia-pt.com.hk/mpf/public/fundperf/fundperf.jspa?mt=MT3&lang=zh_TW'
const DETAILS_PAGE_URL = 'https://www3.aia-pt.com.hk/mpf/public/fundperf/funddetails.jspa?mt=MT3&lang=zh_TW'

// Define company type
const company: CompanyType = 'aia'
// Define fundType
const fundType: FundType = 'mpf'
// Define record type
const recordType: RecordType = 'record'

const scrapeFromAIAMPF = async (page: puppeteer.Page): Promise<FundPriceRecord[]> => {
    // Define time
    const time: FundPriceRecord['time'] = new Date().toISOString();

    // Scrape prices data page
    await page.goto(PRICES_PAGE_URL);
    const pricesData = await getPricesData(page);

    // Scrape performance data page
    await page.goto(PERFORMANCE_PAGE_URL)
    const perfData = await getPerformanceData(page);

    // Scrape details page
    await page.goto(DETAILS_PAGE_URL)
    const detailsData = await getDetailsData(page);

    // Aggregate data based on prices data
    const records: FundPriceRecord[] = pricesData.map(({ code, name, price, updatedDate }) => {
        const perfItem = perfData.find(eachItem => eachItem.code === code);
        const detailsItem = detailsData.find(eachItem => eachItem.name.trim() === name.trim());
        return {
            company,
            code,
            price,
            name,
            updatedDate,
            launchedDate: perfItem?.launchedDate ?? '0000-00-00',
            initialPrice: Number(price) / (1 + (perfItem?.priceChangeRateSinceLaunch ?? 1)),
            riskLevel: detailsItem?.riskLevel ?? 'neutral',
            fundType,
            recordType,
            time,
        }
    });

    return records
}
export default scrapeFromAIAMPF