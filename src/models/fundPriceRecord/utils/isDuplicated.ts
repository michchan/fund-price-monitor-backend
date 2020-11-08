import { FundPriceChangeRate, FundPriceRecord } from '../FundPriceRecord.type'
import isPKEqual from './isPKEqual'
import isSKEqual from './isSKEqual'

/**
 * Get whether a record is duplicated in terms of its nature regarding to its `recordType` and time.
 */
const isDuplicated = <T extends FundPriceRecord | FundPriceChangeRate> (
  based: T,
  compared: T,
): boolean => isPKEqual(based, compared) && isSKEqual(based, compared)
export default isDuplicated