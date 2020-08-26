import { ScheduledHandler } from "aws-lambda";
import puppeteer = require("puppeteer");

import { FundPriceRecord, CompanyType, FundType } from "lib/models/fundPriceRecord/FundPriceRecord.type";
import { scrapeFromLink } from "lib/cron/helpers/scrapeFromLink";


const PAGE_URL = 'https://fundprice.manulife.com.hk/wps/portal/pwsdfphome/dfp/detail?catId=8&locale=zh_HK'
/**
 * Helpers to query data from html
 */
const getDataFromHTML = async (page: puppeteer.Page): Promise<FundPriceRecord[]> => {
    // Wait for the elements we want
    await page.waitForSelector('#viewns_Z7_4P4E1I02I8KL70QQRDQK530054_\\:mainContent\\:datat\\:tbody_element > tr > td > img');

    // Query DOM data
    // * Constants/variables must be inside the scope of the callback function
    const data = await page.evaluate((): FundPriceRecord[] => {
        // Map gif name to risk level
        const riskLevelIndicatorImageNameMap: { [key: string]: FundPriceRecord['riskLevel'] } = {
            'v.gif': 'veryLow',
            'w.gif': 'low',
            'x.gif': 'neutral',
            'y.gif': 'high',
            'z.gif': 'veryHigh',
        }

        // Query table rows nodes
        const tableRows: NodeListOf<HTMLTableRowElement> = document.querySelectorAll('#viewns_Z7_4P4E1I02I8KL70QQRDQK530054_\\:mainContent\\:datat\\:tbody_element > tr');

        // Map table rows data to FundPriceRecord[]
        return Array.from(tableRows).map((row): FundPriceRecord => {
            // Get table cells list
            const dataCells = row.children as HTMLCollectionOf<HTMLTableDataCellElement>
            // Define company type
            const company: CompanyType = 'manulife'
            // Defined fundType
            const fundType: FundType = 'mpf'
            // Get code
            const code = dataCells[0].innerText.trim().replace(/\s|\_/g, '')

            return {
                company,
                code,
                name: dataCells[1].innerText.trim(),
                // Replace 'slashes' with 'hyphens'
                updatedDate: dataCells[2].innerText.trim().replace(/\//g, '-'),
                // Derive price
                price: (() => {
                    const text = dataCells[3].innerText.trim()
                    return +text.replace(/HKD|↵|\n/gim, '')
                })(),
                // Derive initialPrice and launchedDate
                ...(() => {
                    const text = dataCells[5].innerText.trim()
                    const textWithoutDollarSign = text.replace(/^HKD(↵|\n)/gim, '')
                    const [price, date] = textWithoutDollarSign.split(/↵|\n/)
                    return {
                        initialPrice: +price,
                        // Replace 'slashes' with 'hyphens'
                        launchedDate: date.trim().replace(/\//g, '-'),
                    }
                })(),
                // Derive riskLevel
                riskLevel: (() => {
                    const riskIndicatorImg = dataCells[4].querySelector('img')
                    // Find risk level key
                    const key = Object.keys(riskLevelIndicatorImageNameMap)
                        .find(name => riskIndicatorImg?.src.includes(name)) as keyof typeof riskLevelIndicatorImageNameMap;
                    return riskLevelIndicatorImageNameMap[key]
                })(),
                time: new Date().toISOString(),
                fundType,
            }
        })
    })

    return data
}

const scrapeFromManulifeMPF = () => scrapeFromLink(PAGE_URL, getDataFromHTML)

export default scrapeFromManulifeMPF