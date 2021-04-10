import { FundPriceChangeRate } from '@michchan/fund-price-monitor-lib'

const getCompositeSKFromChangeRate = ({
  recordType,
  company,
  period,
  time,
}: FundPriceChangeRate): string => `${recordType}_${company}_${period}@${time}`
export default getCompositeSKFromChangeRate