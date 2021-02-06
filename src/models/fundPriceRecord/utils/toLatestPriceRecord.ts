import FundPriceRecord, { FundType, RecordType } from '../FundPriceRecord.type'
import calculatePriceChangeRate from './calculatePriceChangeRate'

const toLatestPriceRecord = <FT extends FundType> (
  record: FundPriceRecord<FT, 'record'>,
  date?: Date,
  prevRecord?: FundPriceRecord<FT, RecordType>,
): FundPriceRecord<FT, 'latest'> => {
  const previousPrice = prevRecord?.price ?? 0
  return {
    ...record,
    time: date ? date.toISOString() : record.time,
    recordType: 'latest',
    priceChangeRate: calculatePriceChangeRate(previousPrice, record.price),
    previousPrice,
    previousTime: prevRecord?.time ?? null,
  }
}

export default toLatestPriceRecord