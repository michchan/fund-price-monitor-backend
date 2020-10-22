import { FundPriceRecord } from '../FundPriceRecord.type'
import calculatePriceChangeRate from './calculatePriceChangeRate'

const toLatestPriceRecord = (
  record: FundPriceRecord,
  date?: Date,
  prevRecord?: FundPriceRecord,
): FundPriceRecord => ({
  ...record,
  time: date ? date.toISOString() : record.time,
  recordType: 'latest',
  priceChangeRate: calculatePriceChangeRate(prevRecord?.price ?? 0, record.price),
})

export default toLatestPriceRecord