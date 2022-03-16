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

const LIST_CONTAINER_SELECTOR = '.funds-list__items.latest-price'

type TRec = FundPriceRecord<'mpf', 'record'>
type ScrapedRec = TRec & FundDetails

type RiskLevelMap = {
  [key in Exclude<TRec['riskLevel'], 'unknown'>]: string[];
}
type RLKey = keyof RiskLevelMap

// Have to be same scope
const getRecords = (containerSelector: string, lng: Languages): ScrapedRec[] => {
  const company: CompanyType = 'manulife'
  const fundType: FundType = 'mpf'
  const recordType: RecordType = 'record'
  // Map gif name to risk level
  const riskLevelMap: RiskLevelMap = {
    veryLow: ['1'],
    low: ['2', '3'],
    neutral: ['4'],
    high: ['5', '6'],
    veryHigh: ['7'],
  }

  const time = new Date().toISOString()
  const tableRows: NodeListOf<HTMLDivElement> = document.querySelectorAll(
    `${containerSelector} > *`
  )

  const mapRow = (row: HTMLDivElement): ScrapedRec => {
    const code = (row.querySelector('div > div.fundlist-item__col0 > div.fundlist-item__title > div') as HTMLDivElement)
      ?.innerText
      ?.split('·')?.[0]
      ?.trim()
      ?.replace(/\(|\)/g, '') ?? ''

    const name = (row.querySelector(
      'div > div.fundlist-item__col0 > div.fundlist-item__title > h3'
    ) as HTMLHeadingElement)?.innerText?.trim()

    const price = Number((row.querySelector(
      'div > div.fundlist-item__col1.funds-list__item--columns4.show > div > div > div:nth-child(1) > span'
    ) as HTMLSpanElement)
      ?.innerText ?? '0')

    const updatedDate = (() => {
      const dateNode = row.querySelector(
        'div > div.fundlist-item__col1.funds-list__item--columns4.show > div > div > div.sub-value'
      ) as HTMLDivElement
      if (dateNode?.children?.length) dateNode?.removeChild(dateNode?.children[0])
      // In 'DD/MM/YYYY' format
      const rawDate = dateNode?.innerText?.trim()
      return rawDate
        ?.split('/')
        ?.reverse()
        ?.join('-') ?? ''
    })()

    const riskLevel = (() => {
      // From '1' to '7'
      const rawRiskLevel = (row.querySelector(
        'div > div.fundlist-item__col4.funds-list__item--columns4 > div > div.box-risk-points'
      ) as HTMLDivElement)?.innerText?.trim()
      // Find risk level key
      return Object.keys(riskLevelMap)
        .find(riskLevel => riskLevelMap[riskLevel as RLKey]
          .some(riskNum => riskNum === rawRiskLevel)) as keyof RiskLevelMap
    })()

    return {
      company,
      code,
      updatedDate,
      price,
      riskLevel,
      time,
      fundType,
      recordType,
      name: { [lng]: name } as FundDetails['name'],
      // @TODO: Derive initialPrice and launchedDate
      initialPrice: 0,
      launchedDate: updatedDate,
    }
  }
  return Array.from(tableRows)
    .map(mapRow)
    .filter(r => r.price && r.updatedDate)
}

const evaluateData = async <T extends TRec | FundDetails>(
  page: puppeteer.Page,
  evaluateCallback: (viewId: string, lng: Languages) => T[],
  lng: Languages
): Promise<T[]> => {
  // Wait for the elements we want
  await retryWithDelay(
    () => page.waitForSelector(
      // eslint-disable-next-line max-len
      `${LIST_CONTAINER_SELECTOR} > div:last-child > div > div:last-child`
    ),
    'manulifeMPFScrapers'
  )

  // Query DOM data
  // * Constants/variables must be inside the scope of the callback function
  return page.evaluate(evaluateCallback, LIST_CONTAINER_SELECTOR, lng)
}

// Locales recognized by the Manulife website
const locales: { [lng in Languages]: string } = {
  en: 'en',
  zh_HK: 'zh-hk',
}

const getPageProductName = (lng: Languages): string => {
  switch (lng) {
    case 'en':
      return 'Manulife%20Global%20Select%20(MPF)%20Scheme'
    case 'zh_HK':
      return '宏利環球精選(強積金)計劃'
  }
}

const getPageUrl = (lng: Languages) => `https://www.manulife.com.hk/${locales[lng]}/individual/fund-price/mpf.html/v2?product=${getPageProductName(lng)}`

const navigateToPage = (page: puppeteer.Page, lng: Languages) => page.goto(getPageUrl(lng))

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

/** The name 'scrapeDetails' is required by scripts/buildScrapers */
export const scrapeDetails = async (
  page: puppeteer.Page
): Promise<FundDetails[]> => {
  const batches = await pipeAsync<FundDetails[][]>(
    ...languages.map(lng => async (input: FundDetails[][] = []) => {
      await navigateToPage(page, lng)
      const records = await evaluateData(page, getRecords, lng)
      return [
        ...input,
        records.map(rec => pick(rec, [
          'company',
          'code',
          'name',
          'initialPrice',
          'launchedDate',
          'riskLevel',
          'fundType',
        ])),
      ]
    })
  )([])
  return mapAndReduceFundDetailsBatches(batches)
}