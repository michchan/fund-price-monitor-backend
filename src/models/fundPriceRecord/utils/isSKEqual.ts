import { FundPriceRecord, FundPriceChangeRate, RecordType } from '@michchan/fund-price-monitor-lib'

const isSKEqual = <T extends FundPriceRecord | FundPriceChangeRate> (
  based: T,
  compared: T,
): boolean => {
  if (
    based.recordType === RecordType.latest
    && compared.recordType === RecordType.latest
  ) return true

  // Supposed the fund price record is updated daily
  if (
    based.recordType === RecordType.record
    && compared.recordType === RecordType.record
  )
    return based.time.split('T').shift() === compared.time.split('T').shift()

  const basedR = based as FundPriceChangeRate
  const comparedR = compared as FundPriceChangeRate
  return basedR.period === comparedR.period
}
export default isSKEqual