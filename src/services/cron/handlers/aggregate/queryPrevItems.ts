import getDateTimeDictionary from 'src/helpers/getDateTimeDictionary'
import {
  CompanyType,
  FundPriceChangeRate,
  FundPriceRecord,
} from 'src/models/fundPriceRecord/FundPriceRecord.type'
import queryItemsByCompany from 'src/models/fundPriceRecord/io/queryItemsByCompany'
import queryPeriodPriceChangeRate from 'src/models/fundPriceRecord/io/queryPeriodPriceChangeRate'
import TableRange from 'src/models/fundPriceRecord/TableRange.type'
import getPeriodByRecordType from 'src/models/fundPriceRecord/utils/getPeriodByRecordType'
import parse from 'src/models/fundPriceRecord/utils/parse'
import parseChangeRate from 'src/models/fundPriceRecord/utils/parseChangeRate'

export type Output = [
  FundPriceRecord[],
  FundPriceChangeRate[],
  FundPriceChangeRate[],
  FundPriceChangeRate[]
]

const queryPrevItems = async (
  company: CompanyType,
  matchInserted: (rec: FundPriceRecord | FundPriceChangeRate) => boolean,
  date: Date,
): Promise<Output> => {
  // Get year and quarter
  const { year, quarter } = getDateTimeDictionary(date)
  // Create table range
  const tableRange: TableRange = { year, quarter }

  /** Query previous latest records */
  const prevLatestRecords = await queryItemsByCompany(company, true, true, tableRange)
  const prevLatestItems = (prevLatestRecords.Items || [])
    // Parse records
    .map(rec => parse(rec))
    // Filters by insertedItems
    .filter(matchInserted)

  // Query week price change rate
  const [
    prevWeekRateRecords,
    prevMonthRateRecords,
    prevQuarterRateRecords,
  ] = await Promise.all([
    // Week query
    queryPeriodPriceChangeRate(company, 'week', getPeriodByRecordType('week', date), true),
    // Month query
    queryPeriodPriceChangeRate(company, 'month', getPeriodByRecordType('month', date), true),
    // Quarter query
    queryPeriodPriceChangeRate(company, 'quarter', getPeriodByRecordType('quarter', date), true),
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
    prevLatestItems,
    prevWeekRateItems,
    prevMonthRateItems,
    prevQuarterRateItems,
  ]
}
export default queryPrevItems