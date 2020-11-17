import getDateTimeDictionary from 'src/helpers/getDateTimeDictionary'
import FundPriceChangeRate from 'src/models/fundPriceRecord/FundPriceChangeRate.type'
import FundPriceRecord, { CompanyType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import queryItemsByCompany from 'src/models/fundPriceRecord/io/queryItemsByCompany'
import queryPeriodPriceChangeRate from 'src/models/fundPriceRecord/io/queryPeriodPriceChangeRate'
import TableRange from 'src/models/fundPriceRecord/TableRange.type'
import getPeriodByRecordType from 'src/models/fundPriceRecord/utils/getPeriodByRecordType'

type ItemOutput = FundPriceRecord[]
const queryPrevLatestItems = async (
  company: CompanyType,
  matchInserted: (rec: FundPriceRecord | FundPriceChangeRate) => boolean,
  tableRange: TableRange,
): Promise<ItemOutput> => {
  /** Query previous latest records */
  const { parsedItems: prevLatestItems } = await queryItemsByCompany(company, {
    shouldQueryAll: true,
    shouldQueryLatest: true,
    at: tableRange,
  })
  return prevLatestItems.filter(matchInserted)
}

type ChangeRateOutput = [
  FundPriceChangeRate[],
  FundPriceChangeRate[],
  FundPriceChangeRate[]
]
const queryPrevChangeRateItems = async (
  company: CompanyType,
  matchInserted: (rec: FundPriceRecord | FundPriceChangeRate) => boolean,
  date: Date,
): Promise<ChangeRateOutput> => {
  const priceChangeRateQueryInput = { shouldQueryAll: true }
  // Query week price change rate
  const [
    { parsedItems: prevWeekRateItems },
    { parsedItems: prevMonthRateItems },
    { parsedItems: prevQuarterRateItems },
  ] = await Promise.all([
    // Week query
    queryPeriodPriceChangeRate(company, 'week', getPeriodByRecordType('week', date), priceChangeRateQueryInput),
    // Month query
    queryPeriodPriceChangeRate(company, 'month', getPeriodByRecordType('month', date), priceChangeRateQueryInput),
    // Quarter query
    queryPeriodPriceChangeRate(company, 'quarter', getPeriodByRecordType('quarter', date), priceChangeRateQueryInput),
  ])
  return [
    prevWeekRateItems.filter(matchInserted),
    prevMonthRateItems.filter(matchInserted),
    prevQuarterRateItems.filter(matchInserted),
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