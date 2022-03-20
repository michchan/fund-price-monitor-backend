import { FundPriceRecord, FundPriceChangeRate, CompanyType, AggregatedRecordType } from '@michchan/fund-price-monitor-lib'

import getDateTimeDictionary from 'src/helpers/getDateTimeDictionary'
import queryPeriodPriceChangeRate from 'src/models/fundPriceRecord/io/queryPeriodPriceChangeRate'
import queryPrevLatestItems from 'src/models/fundPriceRecord/io/queryPrevLatestItems'
import TableRange from 'src/models/fundPriceRecord/TableRange.type'
import getPeriodByRecordType from 'src/models/fundPriceRecord/utils/getPeriodByRecordType'

type ItemOutput = FundPriceRecord[]

type ChangeRateOutput = [
  FundPriceChangeRate[],
  FundPriceChangeRate[],
  FundPriceChangeRate[]
]
const queryPrevChangeRateItems = async (
  company: CompanyType,
  date: Date,
  filterPredicate: (rec: FundPriceRecord | FundPriceChangeRate) => boolean,
): Promise<ChangeRateOutput> => {
  const priceChangeRateQueryInput = { shouldQueryAll: true }
  // Query week price change rate
  const [
    { parsedItems: prevWeekRateItems },
    { parsedItems: prevMonthRateItems },
    { parsedItems: prevQuarterRateItems },
  ] = await Promise.all([
    // Week query
    queryPeriodPriceChangeRate(
      company,
      AggregatedRecordType.week,
      getPeriodByRecordType(AggregatedRecordType.week, date),
      priceChangeRateQueryInput
    ),
    // Month query
    queryPeriodPriceChangeRate(
      company,
      AggregatedRecordType.month,
      getPeriodByRecordType(AggregatedRecordType.month, date),
      priceChangeRateQueryInput
    ),
    // Quarter query
    queryPeriodPriceChangeRate(
      company,
      AggregatedRecordType.quarter,
      getPeriodByRecordType(AggregatedRecordType.quarter, date),
      priceChangeRateQueryInput
    ),
  ])
  return [
    prevWeekRateItems.filter(filterPredicate),
    prevMonthRateItems.filter(filterPredicate),
    prevQuarterRateItems.filter(filterPredicate),
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

  const prevLatestItems = await queryPrevLatestItems(company, tableRange, matchInserted)
  const prevChangeRatesItems = await queryPrevChangeRateItems(company, date, matchInserted)

  return [prevLatestItems, ...prevChangeRatesItems]
}
export default queryPrevItems