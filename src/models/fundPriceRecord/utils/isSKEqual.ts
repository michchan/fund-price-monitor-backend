import { FundPriceChangeRate, FundPriceRecord } from '../FundPriceRecord.type'

const isSKEqual = <T extends FundPriceRecord | FundPriceChangeRate> (
  based: T,
  compared: T,
): boolean => {
  if (based.recordType === 'latest' && compared.recordType === 'latest') return true
  // Supposed the fund price record is updated daily
  if (based.recordType === 'record' && compared.recordType === 'record')
    return based.time.split('T').shift() === compared.time.split('T').shift()

  const basedR = based as FundPriceChangeRate
  const comparedR = compared as FundPriceChangeRate
  return basedR.period === comparedR.period
}
export default isSKEqual