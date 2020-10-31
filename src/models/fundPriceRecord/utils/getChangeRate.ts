import { AggregatedRecordType, FundPriceChangeRate, FundPriceRecord } from '../FundPriceRecord.type'
import getPeriodByRecordType from './getPeriodByRecordType'
import calculatePriceChangeRate from './calculatePriceChangeRate'

export interface Options {
  prevPriceList: number[];
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
    priceListMode = 'prepend',
    aggregateDate,
  }: Options,
): FundPriceChangeRate => {
  // Get date from basedRecord time
  const date = new Date(basedRecord.time)

  // Get next price list
  const priceList = (() => {
    if (!latestPrice || latestPrice <= 0) return prevPriceList

    return priceListMode === 'prepend'
      ? [...prevPriceList, latestPrice]
      : [latestPrice, ...prevPriceList]
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
    name: basedRecord.name,
    updatedDate: basedRecord.updatedDate,
    price: latestPrice,
    priceChangeRate,
    priceList,
    time: (aggregateDate ?? new Date()).toISOString(),
  }
}

export default getChangeRate