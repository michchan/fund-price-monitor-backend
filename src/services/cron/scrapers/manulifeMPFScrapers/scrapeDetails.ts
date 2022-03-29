import puppeteer = require('puppeteer')
import pipeAsync from 'simply-utils/dist/async/pipeAsync'

import {
  FundDetails,
  Languages,
  FundType,
  FundPriceRecord,
  RiskLevel,
} from '@michchan/fund-price-monitor-lib'
import mapAndReduceFundDetailsBatches from '../../helpers/mapAndReduceFundDetailsBatches'
import retryWithDelay from '../../helpers/retryWithDelay'
import logObj from 'src/helpers/logObj'
import {
  getIndexPageUrl,
  getPageProductName,
  INDEX_PAGE_WAIT_FOR_ELEMENT_SELECTOR,
  locales,
  RiskLevelMap,
  RLKey,
  serializableStaticClientData,
  SerializableStaticClientData,
} from './common'

const INDEX_PAGE_LIST_CONTAINER_SELECTOR = '.funds-list__items.latest-price'

type ScrapedDetails = Omit<FundDetails<FundType.mpf>, 'code' | 'riskLevel'>

type IndexData = Pick<FundPriceRecord<FundType.mpf>, 'code' | 'riskLevel'>

interface SerializableDynamicClientData extends SerializableStaticClientData {
  lng: Languages;
}

// =================================== CLIENT-SIDE CODE ===================================
// Everything should be in the same code and no module bundling to be expected
const getIndexData = (containerSelector: string, clientDataJSON: string): IndexData[] => {
  const {
    riskLevelMap,
  } = JSON.parse(clientDataJSON) as SerializableStaticClientData

  const tableRows: NodeListOf<HTMLDivElement> = document.querySelectorAll(
    `${containerSelector} > *`
  )

  // @TODO: Investigate how to share between other scraper function
  const getCodeFromIndexPageRow = (row: HTMLDivElement): string => (row.querySelector('div > div.fundlist-item__col0 > div.fundlist-item__title > div') as HTMLDivElement)
    ?.innerText
    ?.split('·')?.[0]
    ?.trim()
    ?.replace(/\(|\)/g, '')

  // @TODO: Investigate how to share between other scraper function
  const getRiskLevelFromIndexPageRow = (row: HTMLDivElement): RiskLevel => {
    // From '1' to '7'
    const rawRiskLevel = (row.querySelector(
      'div > div.fundlist-item__col4.funds-list__item--columns4 > div > div.box-risk-points'
    ) as HTMLDivElement)?.innerText?.trim()
    // Find risk level key
    return (
      Object.keys(riskLevelMap)
        .find(riskLevel => riskLevelMap[riskLevel as RLKey]
          .some(riskNum => riskNum === rawRiskLevel)) ?? 'unknown'
    ) as unknown as keyof RiskLevelMap
  }

  const mapRow = (row: HTMLDivElement): IndexData => {
    const code = getCodeFromIndexPageRow(row)
      // Replace multiple codes like "SHK149/DIS149" -> "SHK149"
      ?.split('/')
      ?.shift() ?? ''

    const riskLevel = getRiskLevelFromIndexPageRow(row)

    return { code, riskLevel }
  }
  return Array.from(tableRows).map(mapRow)
}

// Everything should be in the same code and no module bundling to be expected
const getDetailsData = (
  clientDataJSON: string
): ScrapedDetails => {
  const {
    lng,
    company,
    fundType,
  } = JSON.parse(clientDataJSON) as SerializableDynamicClientData

  const name = (() => {
    const el = document.querySelector('funds-funddetails-v2  > .cmp-fund-details .cmp-fund-details__header-title') as HTMLDivElement
    return el.innerText?.replace(/\(.+\)/, '')?.trim() ?? ''
  })()

  const initialPrice = (() => {
    const el = document.querySelector('funds-funddetails-v2 > .cmp-funds-details__container-fund-fact .fundfact_content.snd li.fundfact-list:first-child > *:last-child') as HTMLDivElement
    return Number(el?.innerText ?? '0')
  })()

  const launchedDate = (() => {
    const el = document.querySelector('funds-funddetails-v2 > .cmp-funds-details__container-fund-fact .fundfact_content.snd li.fundfact-list:last-child > *:last-child') as HTMLDivElement
    const rawDate = el?.innerText?.trim()

    const monthMap = {
      Jan: '01',
      Feb: '02',
      Mar: '03',
      Apr: '04',
      May: '05',
      Jun: '06',
      Jul: '07',
      Aug: '08',
      Sep: '09',
      Oct: '10',
      Nov: '11',
      Dec: '12',
    } as const

    // E.g. '21 Feb, 2011' -> '2011-02-21'
    const date = (() => {
      const components = rawDate
        ?.replace(/\,+/g, '')
      // Need to specifically cater case in Languages.zh_HK
        ?.replace(/(\s+)|(年|月|日)/g, ' ')
        ?.trim()
        ?.split(' ')
      const orderedComponents = lng === 'en'
        ? components?.reverse()
        : components
      const zeroPadding = (value: number) => value < 10 ? `0${value}` : value
      return orderedComponents
        ?.map(maybeMonth => {
          const value = (monthMap[maybeMonth as keyof typeof monthMap]) ?? maybeMonth
          return /^\d+$/.test(value) ? zeroPadding(Number(value)) : value
        })
        ?.join('-') ?? ''
    })()

    return date
  })()

  return {
    company,
    name: {
      [lng]: name,
    } as ScrapedDetails['name'],
    initialPrice,
    launchedDate,
    fundType,
  }
}
// =================================== / CLIENT-SIDE CODE ===================================

const evaluateIndexData = async <T extends IndexData>(
  page: puppeteer.Page,
  evaluateCallback: (containerSelector: string, clientDataJSON: string) => T[],
  clientData: SerializableStaticClientData
): Promise<T[]> => {
  // Wait for the elements we want
  await retryWithDelay(
    () => page.waitForSelector(INDEX_PAGE_WAIT_FOR_ELEMENT_SELECTOR),
    'manulifeMPFScrapers.scrapeDetails.evaluateIndexData'
  )
  // Query DOM data
  // * Constants/variables must be inside the scope of the callback function
  return page.evaluate(
    evaluateCallback,
    INDEX_PAGE_LIST_CONTAINER_SELECTOR,
    JSON.stringify(clientData)
  )
}

const evaluateDetailsRecordData = async (
  page: puppeteer.Page,
  evaluateCallback: (clientDataJSON: string) => ScrapedDetails,
  clientData: SerializableDynamicClientData
): Promise<ScrapedDetails> => {
  // Wait for the elements we want
  await retryWithDelay(
    () => page.waitForSelector(
      'funds-funddetails-v2 > .cmp-funds-details__container-fund-fact > * > *:last-child'
    ),
    'manulifeMPFScrapers.scrapeDetails.evaluateIndexData'
  )
  // Query DOM data
  // * Constants/variables must be inside the scope of the callback function
  return page.evaluate(
    evaluateCallback,
    JSON.stringify(clientData)
  )
}

const getDetailsPageUrl = (lng: Languages, code: string) => `https://www.manulife.com.hk/${locales[lng]}/individual/fund-price/mpf.html/v2/funddetails/${code}?product=${getPageProductName(lng)}`

/** The name 'scrapeDetails' is required by scripts/buildScrapers */
export const scrapeDetails = async (
  page: puppeteer.Page
): Promise<FundDetails[]> => {
  await page.goto(getIndexPageUrl(Languages.en))
  const indexData = await evaluateIndexData(page, getIndexData, serializableStaticClientData)
  logObj('Data from index page: ', indexData)

  const batches = await pipeAsync<FundDetails[][]>(
    ...Object.values(Languages).map(lng => async (recordsOfLangs: FundDetails[][] = []) => {
      const recordsPerLang = await pipeAsync<FundDetails[]>(
        ...indexData.map(({ code, riskLevel }) => async (recordsOfCodes: FundDetails[] = []) => {
          await page.goto(getDetailsPageUrl(lng, code))
          logObj('Get details data per code: ', { lng, code })
          const attributesFromDetailsPage = await evaluateDetailsRecordData(page, getDetailsData, {
            ...serializableStaticClientData,
            lng,
          })
          const record = {
            ...attributesFromDetailsPage,
            code,
            riskLevel,
          }
          return [...recordsOfCodes, record]
        })
      )([])
      return [...recordsOfLangs, recordsPerLang]
    })
  )([])
  return mapAndReduceFundDetailsBatches(batches)
}