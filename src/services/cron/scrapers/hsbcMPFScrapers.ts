import puppeteer = require('puppeteer')
import pipeAsync from 'simply-utils/dist/async/pipeAsync'
import pick from 'lodash/pick'
import { CompanyType, FundDetails, FundPriceRecord, FundType, Languages, RecordType, RiskLevel } from '@michchan/fund-price-monitor-lib'

import retryWithDelay from '../helpers/retryWithDelay'
import mapAndReduceFundDetailsBatches from '../helpers/mapAndReduceFundDetailsBatches'

const INDEX_PAGE_LIST_CONTAINER_SELECTOR = '.unit_prices_table > table.desktop'
// eslint-disable-next-line max-len
const INDEX_PAGE_WAIT_FOR_ELEMENT_SELECTOR = `${INDEX_PAGE_LIST_CONTAINER_SELECTOR} > tbody > tr:last-child > td:last-child`

const DETAILS_PAGE_LIST_CONTAINER_SELECTOR = '#content_main_accordion_1'
// eslint-disable-next-line max-len
const DETAILS_PAGE_WAIT_FOR_ELEMENT_SELECTOR = `${DETAILS_PAGE_LIST_CONTAINER_SELECTOR} > .row:last-child`

type TRec = FundPriceRecord<FundType.mpf, RecordType.record>

type RiskLevelMap = {
  [key in RiskLevel]: string[];
}
type RLKey = keyof RiskLevelMap

// Risk level -> risk rating
const riskLevelMap: RiskLevelMap = {
  [RiskLevel.veryLow]: ['1'],
  [RiskLevel.low]: ['2'],
  [RiskLevel.neutral]: ['3'],
  [RiskLevel.high]: ['4'],
  [RiskLevel.veryHigh]: ['5'],
  [RiskLevel.unknown]: [],
}

interface SerializableStaticClientData {
  company: CompanyType;
  fundType: FundType;
  riskLevelMap: RiskLevelMap;
  recordType: RecordType.record;
}
const serializableStaticClientData: SerializableStaticClientData = {
  company: CompanyType.hsbc,
  fundType: FundType.mpf,
  riskLevelMap,
  recordType: RecordType.record,
}

interface SerializableClientData extends SerializableStaticClientData {
  lng: Languages;
}

// =================================== CLIENT-SIDE CODE ===================================
// Everything should be in the same code and no module bundling to be expected
const getDetailsData = (
  containerSelector: string,
  clientDataJSON: string,
): FundDetails[] => {
  const {
    company,
    fundType,
    lng,
    riskLevelMap,
  } = JSON.parse(clientDataJSON) as SerializableClientData

  const tableRows: NodeListOf<HTMLDivElement> = document.querySelectorAll(
    `${containerSelector} > .row`
  )

  return Array.from(tableRows)
    .map(row => {
      const code = (row.querySelector('.anchor') as HTMLDivElement)?.id ?? ''
      const name = (row.querySelector('.expander h4.dropdown-text') as HTMLDivElement)?.innerText?.trim() ?? ''

      const riskLevel = (() => {
        const rawRiskLevel = (
          row.querySelector('section.exp-content .exp-panel .cc-column p:last-of-type') as HTMLParagraphElement
        )
          ?.innerHTML
          ?.replace(/(risk rating is |風險級數為)(\d).+/i, 'risk_rating==$2==')
          ?.split('==')
          ?.filter(Boolean)
          ?.pop() ?? ''
        // Find risk level key
        return (
          Object.keys(riskLevelMap)
            .find(riskLevel => riskLevelMap[riskLevel as RLKey]
              .some(riskNum => riskNum === rawRiskLevel)) ?? 'unknown'
        ) as unknown as keyof RiskLevelMap
      })()

      // @TODO: Scrape these
      const initialPrice = 0
      const launchedDate = ''
      return {
        company,
        code,
        name: {
          [lng]: name,
        } as FundDetails['name'],
        initialPrice,
        launchedDate,
        fundType,
        riskLevel,
      }
    })
    .filter(r => r.code)
}

// Everything should be in the same code and no module bundling to be expected
const getRecordsFromIndexPage = (
  containerSelector: string,
  clientDataJSON: string,
): Omit<TRec, 'riskLevel'>[] => {
  const {
    company,
    fundType,
    recordType,
  } = JSON.parse(clientDataJSON) as SerializableClientData

  const time = new Date().toISOString()
  const updatedDate = (
    document.querySelector('.unitpricesdate select[name="HSBCTRUSTPLUS_selectDate"] > option[selected="selected"]') as HTMLOptionElement
  )?.value ?? ''

  const tableRows: NodeListOf<HTMLTableRowElement> = document.querySelectorAll(
    `${containerSelector} > tbody > tr`
  )

  return Array.from(tableRows)
    .map(row => {
      const code = (row.querySelector('td:first-child > a') as HTMLAnchorElement)?.href?.split('#').pop() ?? ''
      const price = Number((row.querySelector('td:last-child') as HTMLTableCellElement)?.innerText)
      return {
        company,
        code,
        updatedDate,
        price,
        time,
        fundType,
        recordType,
      }
    })
    .filter(r => r.code && r.price)
}
// =================================== / CLIENT-SIDE CODE ===================================

// Locales recognized by the HSBC website
const locales: { [lng in Languages]: string } = {
  en: 'en',
  zh_HK: 'zh-hk',
}

const getIndexPageUrl = (lng: Languages) => {
  if (lng === Languages.en) return 'https://www.hsbc.com.hk/mpf/tool/unit-prices/'
  return `https://www.hsbc.com.hk/${locales[lng]}/mpf/tool/unit-prices/`
}

const getDetailsPageUrl = (lng: Languages) => {
  if (lng === Languages.en) return 'https://www.hsbc.com.hk/mpf/products/funds/'
  return `https://www.hsbc.com.hk/${locales[lng]}/mpf/products/funds/`
}

const evaluateIndexPageData = async <T extends Omit<TRec, 'riskLevel'>>(
  page: puppeteer.Page,
  evaluateCallback: (containerSelector: string, clientDataJSON: string) => T[],
  clientData: SerializableClientData
): Promise<T[]> => {
  // Wait for the elements we want
  await retryWithDelay(
    () => page.waitForSelector(INDEX_PAGE_WAIT_FOR_ELEMENT_SELECTOR),
    'hsbcMPFScrapers.scrapeRecords'
  )
  // Query DOM data
  // * Constants/variables must be inside the scope of the callback function
  return page.evaluate(
    evaluateCallback,
    INDEX_PAGE_LIST_CONTAINER_SELECTOR,
    JSON.stringify(clientData)
  )
}

const evaluateDetailsPageData = async <T extends FundDetails>(
  page: puppeteer.Page,
  evaluateCallback: (containerSelector: string, clientDataJSON: string) => T[],
  clientData: SerializableClientData
): Promise<T[]> => {
  // Wait for the elements we want
  await retryWithDelay(
    () => page.waitForSelector(DETAILS_PAGE_WAIT_FOR_ELEMENT_SELECTOR),
    'hsbcMPFScrapers.scrapeDetails'
  )
  // Query DOM data
  // * Constants/variables must be inside the scope of the callback function
  return page.evaluate(
    evaluateCallback,
    DETAILS_PAGE_LIST_CONTAINER_SELECTOR,
    JSON.stringify(clientData)
  )
}

/** The name 'scrapeDetails' is required by scripts/buildScrapers */
export const scrapeDetails = async (
  page: puppeteer.Page
): Promise<FundDetails[]> => {
  const batches = await pipeAsync<FundDetails[][]>(
    ...Object.values(Languages).map(lng => async (recordsOfLangs: FundDetails[][] = []) => {
      await page.goto(getDetailsPageUrl(lng))
      const recordsPerLang = await evaluateDetailsPageData(
        page,
        getDetailsData,
        { ...serializableStaticClientData, lng }
      )
      return [...recordsOfLangs, recordsPerLang]
    })
  )([])
  return mapAndReduceFundDetailsBatches(batches)
}

/** The name 'scrapeRecords' is required by scripts/buildScrapers */
export const scrapeRecords = async (page: puppeteer.Page): Promise<TRec[]> => {
  const lng = Languages.en

  await page.goto(getIndexPageUrl(lng))
  const indexPageRecords = await evaluateIndexPageData(
    page,
    getRecordsFromIndexPage,
    { ...serializableStaticClientData, lng }
  )

  await page.goto(getDetailsPageUrl(lng))
  // Get risk level data from details page
  const detailsData = await evaluateDetailsPageData(
    page,
    getDetailsData,
    { ...serializableStaticClientData, lng }
  )

  return indexPageRecords.map(rec => ({
    ...rec,
    ...pick(detailsData?.find(d => d.code === rec.code) ?? { riskLevel: RiskLevel.unknown }, 'riskLevel'),
  }))
}