import getDateTimeDictionary from 'src/helpers/getDateTimeDictionary'
import FundPriceChangeRate from 'src/models/fundPriceRecord/FundPriceChangeRate.type'
import FundPriceRecord, { CompanyType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import queryItemsByCompany from 'src/models/fundPriceRecord/io/queryItemsByCompany'
import queryPeriodPriceChangeRate from 'src/models/fundPriceRecord/io/queryPeriodPriceChangeRate'
import TableRange from 'src/models/fundPriceRecord/TableRange.type'
import getPeriodByRecordType from 'src/models/fundPriceRecord/utils/getPeriodByRecordType'
import parseRecords from 'src/models/fundPriceRecord/utils/parseRecords'
import parseChangeRate from 'src/models/fundPriceRecord/utils/parseChangeRate'

type ItemOutput = FundPriceRecord[]
const queryPrevLatestItems = async (
  company: CompanyType,
  matchInserted: (rec: FundPriceRecord | FundPriceChangeRate) => boolean,
  tableRange: TableRange,
): Promise<ItemOutput> => {
  /** Query previous latest records */
  const prevLatestRecords = await queryItemsByCompany(company, {
    shouldQueryAll: true,
    shouldQueryLatest: true,
    at: tableRange,
  })
  const prevLatestItems = (prevLatestRecords.Items || [])
    // Parse records
    .map(rec => parseRecords(rec))
    // Filters by insertedItems
    .filter(matchInserted)

  return prevLatestItems
}

type ChangeRateOutput = [
  FundPriceChangeRate[],
  FundPriceChangeRate[],
  FundPriceChangeRate[]
]
const priceChangeRateQueryInput = { shouldQueryAll: true }
const queryPrevChangeRateItems = async (
  company: CompanyType,
  matchInserted: (rec: FundPriceRecord | FundPriceChangeRate) => boolean,
  date: Date,
): Promise<ChangeRateOutput> => {
  // Query week price change rate
  const [
    prevWeekRateRecords,
    prevMonthRateRecords,
    prevQuarterRateRecords,
  ] = await Promise.all([
    // Week query
    queryPeriodPriceChangeRate(company, 'week', getPeriodByRecordType('week', date), priceChangeRateQueryInput),
    // Month query
    queryPeriodPriceChangeRate(company, 'month', getPeriodByRecordType('month', date), priceChangeRateQueryInput),
    // Quarter query
    queryPeriodPriceChangeRate(company, 'quarter', getPeriodByRecordType('quarter', date), priceChangeRateQueryInput),
  ])

  // Parse previous records
  const prevWeekRateItems = (prevWeekRateRecords.Items ?? [])
    .map(rec => parseChangeRate(rec))
    .filter(matchInserted)
  const prevMonthRateItems = (prevMonthRateRecords.Items ?? [])
    .map(rec => parseChangeRate(rec))
    .filter(matchInserted)
  const prevQuarterRateItems = (prevQuarterRateRecords.Items ?? [])
    .map(rec => parseChangeRate(rec))
    .filter(matchInserted)

  return [
    prevWeekRateItems,
    prevMonthRateItems,
    prevQuarterRateItems,
  ]
}

export type Output = [ItemOutput, ...ChangeRateOutput]
const queryPrevItems = async (
  company: CompanyType,
  matchInserted: (rec: FundPriceRecord | FundPriceChangeRate) => boolean,
  date: Date,
): Promise<Output> => {
  // Get year and quarter
  const { year, quarter } = getDateTimeDictionary(date)
  // Create table range
  const tableRange: TableRange = { year, quarter }

  const prevLatestItems = await queryPrevLatestItems(company, matchInserted, tableRange)
  const prevChangeRatesItems = await queryPrevChangeRateItems(company, matchInserted, date)

  return [prevLatestItems, ...prevChangeRatesItems]
}
export default queryPrevItems