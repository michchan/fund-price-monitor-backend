import puppeteer = require('puppeteer')
import languages from 'src/models/fundPriceRecord/constants/languages'
import pipeAsync from 'simply-utils/dist/async/pipeAsync'
import pick from 'lodash/pick'

import {
  FundPriceRecord,
  FundDetails,
  Languages,
  CompanyType,
  FundType,
  RecordType,
} from '@michchan/fund-price-monitor-lib'
import mapAndReduceFundDetailsBatches from '../helpers/mapAndReduceFundDetailsBatches'
import retryWithDelay from '../helpers/retryWithDelay'

const VIEW_ID = '#viewns_Z7_4P4E1I02I8KL70QQRDQK530054'

type TRec = FundPriceRecord<'mpf', 'record'>
type ScrapedRec = TRec & FundDetails

type RiskLevelIndicatorImageNamesMap = {
  [key in TRec['riskLevel']]: string[]
}

// Have to be same scope
const getRecords = (viewId: string, lng: Languages): ScrapedRec[] => {
  const company: CompanyType = 'manulife'
  const fundType: FundType = 'mpf'
  const recordType: RecordType = 'record'
  // Map gif name to risk level
  const riskLevelIndicatorImageNamesMap: RiskLevelIndicatorImageNamesMap = {
    veryLow: ['v.gif', 'vc.gif'],
    low: ['w.gif', 'wc.gif'],
    neutral: ['x.gif', 'xc.gif'],
    high: ['y.gif', 'yc.gif'],
    veryHigh: ['z.gif', 'zc.gif'],
  }
  const time = new Date().toISOString()
  const tableRows: NodeListOf<HTMLTableRowElement> = document
    .querySelectorAll(`${viewId}_\\:mainContent\\:datat\\:tbody_element > tr`)

  const mapRow = (row: HTMLTableRowElement): ScrapedRec => {
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
      return Object.keys(riskLevelIndicatorImageNamesMap)
        .find(riskLevel => riskLevelIndicatorImageNamesMap[riskLevel as TRec['riskLevel']].some(
          val => riskIndicatorImg?.src?.includes(val)
        )) as keyof RiskLevelIndicatorImageNamesMap
    })()
    return {
      company,
      code,
      // Replace 'slashes' with 'hyphens'
      updatedDate: dataCells[2].innerText.trim().replace(/\//g, '-'),
      price,
      riskLevel,
      time,
      fundType,
      recordType,
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
  }
  return Array.from(tableRows).map(mapRow)
}

const evaluateData = async <T extends TRec | FundDetails> (
  page: puppeteer.Page,
  evaluateCallback: (viewId: string, lng: Languages) => T[],
  lng: Languages,
): Promise<T[]> => {
  // Wait for the elements we want
  await retryWithDelay(() => page.waitForSelector(
    `${VIEW_ID}_\\:mainContent\\:datat\\:tbody_element > tr:last-child > td > img`
  ), 'manulifeMPFScrapers')

  // Query DOM data
  // * Constants/variables must be inside the scope of the callback function
  return page.evaluate(evaluateCallback, VIEW_ID, lng)
}

// Locales recognized by the Manulife website
const locales: { [lng in Languages]: string } = {
  en: 'en',
  zh_HK: 'zh_TW',
}

const getPageUrl = (lng: Languages) => `https://fundprice.manulife.com.hk/wps/portal/pwsdfphome/dfp/detail?catId=8&locale=${locales[lng]}`

const langCookieKeys = [
  'ManulifeLang',
  'com.ibm.wps.state.preprocessors.locale.LanguageCookie',
]
const COOKIE_DOMAIN = 'fundprice.manulife.com.hk'

const navigateToPage = async (page: puppeteer.Page, lng: Languages) => {
  await page.setCookie(...langCookieKeys.map(name => ({
    name,
    value: locales[lng],
    domain: COOKIE_DOMAIN,
  })))
  return page.goto(getPageUrl(lng))
}

/** The name 'scrapeRecords' is required by scripts/buildScrapers */
export const scrapeRecords = async (page: puppeteer.Page): Promise<TRec[]> => {
  const lng: Languages = 'zh_HK'
  await navigateToPage(page, lng)
  const records = await evaluateData(page, getRecords, lng)
  return records.map(rec => pick(rec, [
    'company',
    'code',
    'updatedDate',
    'price',
    'riskLevel',
    'time',
    'fundType',
    'recordType',
  ]))
}

export const scrapeDetails = async (page: puppeteer.Page): Promise<FundDetails[]> => {
  const batches = await pipeAsync<FundDetails[][]>(
    ...languages.map(lng => async (input: FundDetails[][] = []) => {
      await navigateToPage(page, lng)
      const records = await evaluateData(page, getRecords, lng)
      return [...input, records.map(rec => pick(rec, [
        'company',
        'code',
        'name',
        'initialPrice',
        'launchedDate',
        'riskLevel',
        'fundType',
      ]))]
    })
  )([])
  return mapAndReduceFundDetailsBatches(batches)
}