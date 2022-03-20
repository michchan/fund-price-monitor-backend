import { FundPriceRecord, FundPriceChangeRate, AggregatedRecordType, FundType, RecordType } from '@michchan/fund-price-monitor-lib'
import getChangeRate from 'src/models/fundPriceRecord/utils/getChangeRate'
import toLatestPriceRecord from 'src/models/fundPriceRecord/utils/toLatestPriceRecord'
import { Output as Input } from './queryPrevItems'

export type Output = Input

const deriveAggregatedItems = (
  insertedItems: FundPriceRecord<FundType, RecordType.record>[],
  date: Date,
  ...rest: Output
): Output => {
  const [
    prevLatestItems,
    prevWeekRateItems,
    prevMonthRateItems,
    prevQuarterRateItems,
  ] = rest

  // Aggregation for latest price
  const latestItems = insertedItems.map(item => {
    const prevItem = prevLatestItems.find(eachItem => eachItem.code === item.code)
    return toLatestPriceRecord(item, date, prevItem)
  })

  /**
   * Derive next change rate records
   */
  const deriveChangeRateRecords = (
    type: AggregatedRecordType,
    prevItems: FundPriceChangeRate[],
  ) => latestItems.map(item => {
    const prevChangeRate = prevItems.find(chRate => chRate.code === item.code)
    const nextChangeRate = getChangeRate(prevChangeRate ?? item, type, item.price, {
      prevPriceList: prevChangeRate?.priceList ?? [],
      prevPriceTimestampList: prevChangeRate?.priceTimestampList ?? [],
      priceListMode: 'prepend',
      aggregateDate: date,
    })
    return nextChangeRate
  })

  // Derive records to save
  const weekRateItems = deriveChangeRateRecords(
    AggregatedRecordType.week,
    prevWeekRateItems
  )
  const monthRateItems = deriveChangeRateRecords(
    AggregatedRecordType.month,
    prevMonthRateItems
  )
  const quarterRateItems = deriveChangeRateRecords(
    AggregatedRecordType.quarter,
    prevQuarterRateItems
  )

  return [
    latestItems,
    weekRateItems,
    monthRateItems,
    quarterRateItems,
  ]
}
export default deriveAggregatedItems