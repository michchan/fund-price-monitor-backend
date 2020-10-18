import { AggregatedRecordType, FundPriceChangeRate, FundPriceRecord } from "src/models/fundPriceRecord/FundPriceRecord.type"
import getChangeRate from "src/models/fundPriceRecord/utils/getChangeRate"
import toLatestPriceRecord from "src/models/fundPriceRecord/utils/toLatestPriceRecord"
import { Output as Input } from './queryPrevItems'


export type Output = Input

const deriveAggregatedItems = (
  insertedItems: FundPriceRecord[],
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
    const nextChangeRate = getChangeRate(
      prevChangeRate ?? item, 
      type, 
      item.price, 
      prevChangeRate?.priceList ?? [],
      'prepend',
      date
    )
    return nextChangeRate
  })

  // Derive records to save
  const weekRateItems = deriveChangeRateRecords('week', prevWeekRateItems)
  const monthRateItems = deriveChangeRateRecords('month', prevMonthRateItems)
  const quarterRateItems = deriveChangeRateRecords('quarter', prevQuarterRateItems)

  return [
    latestItems,
    weekRateItems,
    monthRateItems,
    quarterRateItems,
  ]
}
export default deriveAggregatedItems