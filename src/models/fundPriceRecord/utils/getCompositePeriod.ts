import { FundPriceChangeRate } from '@michchan/fund-price-monitor-lib'

type T = Pick<FundPriceChangeRate, 'recordType' | 'company' | 'period'>
const getCompositePeriod = ({
  recordType,
  company,
  period,
}: T): string => `${recordType}_${company}_${period}`
export default getCompositePeriod