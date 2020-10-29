import { FundPriceChangeRate, FundPriceRecord } from '../FundPriceRecord.type'

/**
 * Get whether a record is duplicated in terms of its nature regarding to its `recordType` and time.
 */
const isDuplicated = <T extends FundPriceRecord | FundPriceChangeRate> (
  based: T,
  compared: T,
): boolean => {
  const isPKEqual = `${based.company}_${based.code}` === `${compared.company}_${compared.code}`
  const isTimeKeyEqual = (() => {
    if (based.recordType === 'latest' && compared.recordType === 'latest') return true
    if (based.recordType === 'record' && compared.recordType === 'record')
      return based.time.split('T').shift() === compared.time.split('T').shift()

    const basedR = based as FundPriceChangeRate
    const comparedR = compared as FundPriceChangeRate
    return basedR.period === comparedR.period
  })()
  return isPKEqual && isTimeKeyEqual
}
export default isDuplicated