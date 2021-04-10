import { AggregatedRecordType, FundPriceRecord, FundPriceChangeRate } from '@michchan/fund-price-monitor-lib'
import getPeriodByRecordType from './getPeriodByRecordType'
import calculatePriceChangeRate from './calculatePriceChangeRate'

export interface Options {
  prevPriceList: number[];
  prevPriceTimestampList: string[];
  /** Default to 'prepend' */
  priceListMode: 'append' | 'prepend';
  aggregateDate?: Date;
}
const getChangeRate = (
  basedRecord: FundPriceRecord | FundPriceChangeRate,
  recordType: AggregatedRecordType,
  latestPrice: number,
  {
    prevPriceList = [],
    prevPriceTimestampList = [],
    priceListMode = 'prepend',
    aggregateDate,
  }: Options,
): FundPriceChangeRate => {
  // Get date from basedRecord time
  const date = new Date(basedRecord.time)
  const time = (aggregateDate ?? new Date()).toISOString()

  const hasNoLatestPrice = !latestPrice || latestPrice <= 0

  // Get next price list
  const priceList = (() => {
    if (hasNoLatestPrice) return prevPriceList
    return priceListMode === 'prepend'
      ? [...prevPriceList, latestPrice]
      : [latestPrice, ...prevPriceList]
  })()

  const priceTimestampList = (() => {
    if (hasNoLatestPrice) return prevPriceTimestampList
    return priceListMode === 'prepend'
      ? [...prevPriceTimestampList, time]
      : [time, ...prevPriceTimestampList]
  })()

  const [startPrice] = priceList
  const endPrice = priceList[priceList.length - 1]
  // Calculate change rate
  const priceChangeRate = calculatePriceChangeRate(startPrice, endPrice)

  return {
    recordType,
    period: getPeriodByRecordType(recordType, date),
    company: basedRecord.company,
    code: basedRecord.code,
    updatedDate: basedRecord.updatedDate,
    price: latestPrice,
    priceChangeRate,
    priceList,
    priceTimestampList,
    time,
  }
}

export default getChangeRate