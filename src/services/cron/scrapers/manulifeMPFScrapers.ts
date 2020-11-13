import puppeteer = require('puppeteer')
import languages from 'src/models/fundPriceRecord/constants/languages'

import FundDetails, { Languages } from 'src/models/fundPriceRecord/FundDetails.type'
import FundPriceRecord, {
  CompanyType,
  FundType,
  RecordType,
} from 'src/models/fundPriceRecord/FundPriceRecord.type'
import getCompanyCodePK from 'src/models/fundPriceRecord/utils/getCompanyCodePK'
import retryWithDelay from '../helpers/retryWithDelay'

type TRec = FundPriceRecord<'mpf', 'record'>
interface RiskLevlIndicatorImageNameMap {
  [key: string]: TRec['riskLevel'];
}

// Have to be same scope
// eslint-disable-next-line max-lines-per-function
const getRecords = (): TRec[] => {
  const company: CompanyType = 'manulife'
  const fundType: FundType = 'mpf'
  const recordType: RecordType = 'record'
  // Map gif name to risk level
  const riskLevelIndicatorImageNameMap: { [key: string]: TRec['riskLevel'] } = {
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

  const getRowMapper = (
    riskLevelIndicatorImageNameMap: RiskLevlIndicatorImageNameMap,
    time: string,
  ) => (row: HTMLTableRowElement): TRec => {
    // Get table cells list
    const dataCells = row.children as HTMLCollectionOf<HTMLTableDataCellElement>
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

  // Map table rows data to TRec[]
  return Array.from(tableRows).map(getRowMapper(riskLevelIndicatorImageNameMap, time))
}

const getDetailsGetter = (lng: Languages) => (): FundDetails[] => {
  const company: CompanyType = 'manulife'
  // Query table rows nodes
  const viewId = '#viewns_Z7_4P4E1I02I8KL70QQRDQK530054'
  const tableRows: NodeListOf<HTMLTableRowElement> = document
    .querySelectorAll(`${viewId}_\\:mainContent\\:datat\\:tbody_element > tr`)
  return Array.from(tableRows).map((row: HTMLTableRowElement): FundDetails => {
    // Get table cells list
    const dataCells = row.children as HTMLCollectionOf<HTMLTableDataCellElement>
    const code = dataCells[0].innerText.trim().replace(/\s|_/g, '')
    return {
      company,
      code,
      name: { [lng]: dataCells[1].innerText.trim() } as FundDetails['name'],
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
  })
}

const evaluateData = async <T extends TRec | FundDetails> (
  page: puppeteer.Page,
  evaluateCallback: () => T[],
): Promise<T[]> => {
  // Wait for the elements we want
  const viewId = '#viewns_Z7_4P4E1I02I8KL70QQRDQK530054'
  await retryWithDelay(() => page.waitForSelector(
    `${viewId}_\\:mainContent\\:datat\\:tbody_element > tr:last-child > td > img`
  ), 'manulifeMPFScrapers')

  // Query DOM data
  // * Constants/variables must be inside the scope of the callback function
  return page.evaluate(evaluateCallback)
}

const locales: { [lng in Languages]: string } = {
  en: 'en',
  zh_HK: 'zh_TW',
}
const getPageUrl = (lng: Languages) => {
  const locale = locales[lng]
  return `https://fundprice.manulife.com.hk/wps/portal/pwsdfphome/dfp/detail?catId=8&locale=${locale}`
}

/** The name 'scrapeRecords' is required by scripts/buildScrapers */
export const scrapeRecords = async (page: puppeteer.Page): Promise<TRec[]> => {
  await page.goto(getPageUrl('en'))
  return evaluateData(page, getRecords)
}

export const scrapeDetails = async (page: puppeteer.Page): Promise<FundDetails[]> => {
  const batches = await Promise.all(languages.map(async lng => {
    await page.goto(getPageUrl(lng))
    return evaluateData(page, getDetailsGetter(lng))
  }))
  const records = batches.reduce((acc, curr) => [...acc, ...curr], [])
  return records.reduce((acc, curr) => {
    const prevIndex = acc.findIndex(item => getCompanyCodePK(item) === getCompanyCodePK(curr))
    if (prevIndex) {
      const prev = acc[prevIndex]
      const next: FundDetails = {
        ...prev,
        ...curr,
        name: { ...prev.name, ...curr.name },
      }
      const nextAcc = [...acc]
      nextAcc[prevIndex] = next
      return nextAcc
    }
    return [...acc, curr]
  }, [] as FundDetails[])
}