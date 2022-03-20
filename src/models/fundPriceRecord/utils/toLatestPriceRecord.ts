import isSameDay from 'simply-utils/dist/dateTime/isSameDay'
import { FundPriceRecord, FundType, RecordType } from '@michchan/fund-price-monitor-lib'
import calculatePriceChangeRate from './calculatePriceChangeRate'

const toLatestPriceRecord = <FT extends FundType> (
  record: FundPriceRecord<FT, RecordType.record>,
  date?: Date,
  prevRecord?: FundPriceRecord<FT, RecordType>,
): FundPriceRecord<FT, RecordType.latest> => {
  const time = date ? date.toISOString() : record.time
  const isDifferentDay = (
    prevRecord?.time
    && !isSameDay(new Date(prevRecord?.time), new Date(time))
  )

  const previousPrice = prevRecord?.price ?? 0
  const previousDayPrice = isDifferentDay
    // This 'record' will be the price of today and
    // The 'price' of 'prevRecord' will be 'previousDayPrice'
    ? previousPrice
    // Inherit 'previousDayPrice' of the 'prevRecord'
    : prevRecord?.previousDayPrice ?? 0

  return {
    ...record,
    time,
    recordType: RecordType.latest,
    priceChangeRate: calculatePriceChangeRate(previousPrice, record.price),
    dayPriceChangeRate: calculatePriceChangeRate(previousDayPrice, record.price),
    previousPrice,
    previousDayPrice,
    previousTime: prevRecord?.time ?? null,
  }
}

export default toLatestPriceRecord