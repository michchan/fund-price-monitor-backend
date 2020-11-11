import FundPriceRecord, { FundType, RecordType } from '../FundPriceRecord.type'
import calculatePriceChangeRate from './calculatePriceChangeRate'

const toLatestPriceRecord = <FT extends FundType> (
  record: FundPriceRecord<FT, 'record'>,
  date?: Date,
  prevRecord?: FundPriceRecord<FT, RecordType>,
): FundPriceRecord<FT, 'latest'> => ({
  ...record,
  time: date ? date.toISOString() : record.time,
  recordType: 'latest',
  priceChangeRate: calculatePriceChangeRate(prevRecord?.price ?? 0, record.price),
})

export default toLatestPriceRecord