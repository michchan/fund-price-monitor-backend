import puppeteer = require('puppeteer')

import {
  FundPriceRecord,
  Languages,
  FundType,
  RecordType,
  RiskLevel,
} from '@michchan/fund-price-monitor-lib'
import retryWithDelay from '../../helpers/retryWithDelay'
import {
  getIndexPageUrl,
  INDEX_PAGE_LIST_CONTAINER_SELECTOR,
  INDEX_PAGE_WAIT_FOR_ELEMENT_SELECTOR,
  RiskLevelMap,
  RLKey,
  serializableStaticClientData,
  SerializableStaticClientData,
} from './common'

type TRec = FundPriceRecord<FundType.mpf, RecordType.record>

interface SerializableClientData extends SerializableStaticClientData {
  recordType: RecordType.record;
}

const clientData: SerializableClientData = {
  ...serializableStaticClientData,
  recordType: RecordType.record,
}

// =================================== CLIENT-SIDE CODE ===================================
// Everything should be in the same code and no module bundling to be expected
const getRecords = (
  containerSelector: string,
  clientDataJSON: string,
): TRec[] => {
  const {
    company,
    fundType,
    recordType,
    riskLevelMap,
  } = JSON.parse(clientDataJSON) as SerializableClientData

  const time = new Date().toISOString()
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
    return (Object.keys(riskLevelMap)
      .find(riskLevel => riskLevelMap[riskLevel as RLKey]
        .some(riskNum => riskNum === rawRiskLevel)) ?? 'unknown') as unknown as keyof RiskLevelMap
  }

  const mapRow = (row: HTMLDivElement): TRec => {
    const code = getCodeFromIndexPageRow(row)
    const riskLevel = getRiskLevelFromIndexPageRow(row)

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

    return {
      company,
      code,
      updatedDate,
      price,
      riskLevel,
      time,
      fundType,
      recordType,
    }
  }
  return Array.from(tableRows)
    .map(mapRow)
    .filter(r => r.price && r.updatedDate)
}
// =================================== / CLIENT-SIDE CODE ===================================

const evaluateData = async <T extends TRec>(
  page: puppeteer.Page,
  evaluateCallback: (containerSelector: string, clientDataJSON: string) => T[],
  clientData: SerializableClientData
): Promise<T[]> => {
  // Wait for the elements we want
  await retryWithDelay(
    () => page.waitForSelector(INDEX_PAGE_WAIT_FOR_ELEMENT_SELECTOR),
    'manulifeMPFScrapers.scrapeRecords'
  )
  // Query DOM data
  // * Constants/variables must be inside the scope of the callback function
  return page.evaluate(
    evaluateCallback,
    INDEX_PAGE_LIST_CONTAINER_SELECTOR,
    JSON.stringify(clientData)
  )
}

/** The name 'scrapeRecords' is required by scripts/buildScrapers */
export const scrapeRecords = async (page: puppeteer.Page): Promise<TRec[]> => {
  const lng = Languages.zh_HK
  await page.goto(getIndexPageUrl(lng))
  return evaluateData(page, getRecords, clientData)
}