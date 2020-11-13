import puppeteer = require('puppeteer')

import FundPriceRecord, {
  CompanyType,
  FundType,
  RecordType,
} from 'src/models/fundPriceRecord/FundPriceRecord.type'
import retryWithDelay from '../helpers/retryWithDelay'

type T = FundPriceRecord<'mpf', 'record'>
interface RiskLevlIndicatorImageNameMap {
  [key: string]: T['riskLevel'];
}

// Have to be same scope
// eslint-disable-next-line max-lines-per-function
const evaluatePage = (): T[] => {
  // Map gif name to risk level
  const riskLevelIndicatorImageNameMap: { [key: string]: T['riskLevel'] } = {
    'v.gif': 'veryLow',
    'w.gif': 'low',
    'x.gif': 'neutral',
    'y.gif': 'high',
    'z.gif': 'veryHigh',
  }
  // Create a timestamp for current scrape
  const time = new Date().toISOString()

  // Query table rows nodes
  const viewId = '#viewns_Z7_4P4E1I02I8KL70QQRDQK530054'
  const tableRows: NodeListOf<HTMLTableRowElement> = document
    .querySelectorAll(`${viewId}_\\:mainContent\\:datat\\:tbody_element > tr`)

  const getMapRowToRecord = (
    riskLevelIndicatorImageNameMap: RiskLevlIndicatorImageNameMap,
    time: string,
  ) => (row: HTMLTableRowElement): T => {
    // Get table cells list
    const dataCells = row.children as HTMLCollectionOf<HTMLTableDataCellElement>
    const company: CompanyType = 'manulife'
    const fundType: FundType = 'mpf'
    const recordType: RecordType = 'record'
    const code = dataCells[0].innerText.trim().replace(/\s|_/g, '')
    const price = (() => {
      const text = dataCells[3].innerText.trim()
      return Number(text.replace(/HKD|↵|\n/gim, ''))
    })()
    const riskLevel = (() => {
      const riskIndicatorImg = dataCells[4].querySelector('img')
      // Find risk level key
      const key = Object.keys(riskLevelIndicatorImageNameMap)
        .find(name => riskIndicatorImg?.src.includes(name)) as keyof RiskLevlIndicatorImageNameMap
      return riskLevelIndicatorImageNameMap[key]
    })()
    return {
      company,
      code,
      name: dataCells[1].innerText.trim(),
      // Replace 'slashes' with 'hyphens'
      updatedDate: dataCells[2].innerText.trim().replace(/\//g, '-'),
      // Derive price
      price,
      // Derive riskLevel
      riskLevel,
      time,
      fundType,
      recordType,
      // Derive initialPrice and launchedDate
      ...(() => {
        const text = dataCells[5].innerText.trim()
        const textWithoutDollarSign = text.replace(/^HKD(↵|\n)/gim, '')
        const [price, date] = textWithoutDollarSign.split(/↵|\n/)
        return {
          initialPrice: Number(price),
          // Replace 'slashes' with 'hyphens'
          launchedDate: date.trim().replace(/\//g, '-'),
        }
      })(),
    }
  }

  // Map table rows data to T[]
  return Array.from(tableRows).map(getMapRowToRecord(riskLevelIndicatorImageNameMap, time))
}

/**
 * Helpers to query data from html
 */
const getDataFromHTML = async (page: puppeteer.Page): Promise<T[]> => {
  // Wait for the elements we want
  const viewId = '#viewns_Z7_4P4E1I02I8KL70QQRDQK530054'
  await retryWithDelay(() => page.waitForSelector(
    `${viewId}_\\:mainContent\\:datat\\:tbody_element > tr:last-child > td > img`
  ), 'scrapeFromManulifeMPF')

  // Query DOM data
  // * Constants/variables must be inside the scope of the callback function
  return page.evaluate(evaluatePage)
}

const PAGE_URL = 'https://fundprice.manulife.com.hk/wps/portal/pwsdfphome/dfp/detail?catId=8&locale=zh_TW'

/** The name 'scrapeRecords' is required by scripts/buildScrapers */
export const scrapeRecords = async (page: puppeteer.Page): Promise<T[]> => {
  await page.goto(PAGE_URL)
  return getDataFromHTML(page)
}