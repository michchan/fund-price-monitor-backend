import { Page } from 'puppeteer-core'
import pipeAsync from 'simply-utils/async/pipeAsync'
import {
  FundPriceRecord,
  CompanyType,
  FundType,
  RecordType,
  FundDetails,
  Languages,
  RiskLevel,
} from '@michchan/fund-price-monitor-lib'

import getPricesData, { PriceDataRecord } from './getPricesData'
import getPerformanceData, { PerfDataRecord } from './getPerformanceData'
import getDetailsData, { DetailsDataRecord } from './getDetailsData'
import mapAndReduceFundDetailsBatches from '../../helpers/mapAndReduceFundDetailsBatches'

// Locales recognized by the AIA website
const locales: { [lng in Languages]: string } = {
  en: 'en',
  zh_HK: 'zh_TW',
}
const getPricesPageUrl = (lng: Languages) => `https://www3.aia-pt.com.hk/mpf/public/fundperf/fundprices.jspa?mt=MT3&lang=${locales[lng]}`
const getPerformancePageUrl = (lng: Languages) => `https://www3.aia-pt.com.hk/mpf/public/fundperf/fundperf.jspa?mt=MT3&lang=${locales[lng]}`
const getDetailsPageUrl = (lng: Languages) => `https://www3.aia-pt.com.hk/mpf/public/fundperf/funddetails.jspa?mt=MT3&lang=${locales[lng]}`

type TRec = FundPriceRecord<FundType, RecordType.record>
type RecordMapper <T> = (
  priceData: PriceDataRecord,
  perfData: PerfDataRecord,
  detailsData: DetailsDataRecord,
  time: string,
) => T

// Define company type
const company = CompanyType.aia
// Define fundType
const fundType = FundType.mpf
// Define record type
const recordType = RecordType.record

const evaluateData = async <T> (
  page: Page,
  lng: Languages,
  mapRecord: RecordMapper<T>,
): Promise<T[]> => {
  // Scrape prices data page
  await page.goto(getPricesPageUrl(lng))
  const pricesData = await getPricesData(page)

  // Scrape performance data page
  await page.goto(getPerformancePageUrl(lng))
  const perfData = await getPerformanceData(page)

  // Scrape details page
  await page.goto(getDetailsPageUrl(lng))
  const detailsData = await getDetailsData(page)

  // Define time
  const time = new Date().toISOString()

  // Aggregate data based on prices data
  return pricesData.map(priceAttrs => {
    const { name, code } = priceAttrs
    const perfAttrs = perfData.find(eachItem => eachItem.code === code) as PerfDataRecord
    const detailsAttrs = detailsData
      .find(eachItem => eachItem.name.trim() === name.trim()) as DetailsDataRecord
    return mapRecord(priceAttrs, perfAttrs, detailsAttrs, time)
  })
}

/** The name 'scrapeRecords' is required by scripts/buildScrapers */
export const scrapeRecords = (
  page: Page
): Promise<TRec[]> => evaluateData(
  page,
  Languages.zh_HK,
  (priceAttrs, perfAttrs, detailsAttrs, time): TRec => {
    const { code, price, updatedDate } = priceAttrs
    return {
      company,
      code,
      price,
      updatedDate,
      riskLevel: detailsAttrs?.riskLevel ?? RiskLevel.unknown,
      fundType,
      recordType,
      time,
    }
  }
)

/** The name 'scrapeDetails' is required by scripts/buildScrapers */
export const scrapeDetails = async (page: Page): Promise<FundDetails[]> => {
  const batches = await pipeAsync<FundDetails[][]>(
    ...Object.values(Languages).map(lng => async (recordsOfLangs: FundDetails[][] = []) => {
      const recordsPerLang = await evaluateData(page, lng, (
        priceAttrs,
        perfAttrs,
        detailsAttrs
      ): FundDetails => {
        const { code, name, price } = priceAttrs
        return {
          code,
          company,
          name: { [lng]: name } as FundDetails['name'],
          launchedDate: perfAttrs?.launchedDate ?? '0000-00-00',
          initialPrice: Number(price) / (1 + (perfAttrs?.priceChangeRateSinceLaunch ?? 1)),
          fundType,
          riskLevel: detailsAttrs?.riskLevel ?? RiskLevel.unknown,
        }
      })
      return [...recordsOfLangs, recordsPerLang]
    })
  )([])
  return mapAndReduceFundDetailsBatches(batches)
}