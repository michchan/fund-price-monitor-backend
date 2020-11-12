import FundPriceChangeRate from '../FundPriceChangeRate.type'

type T = Pick<FundPriceChangeRate, 'recordType' | 'company' | 'period'>
const getCompositePeriod = ({
  recordType,
  company,
  period,
}: T): string => `${recordType}_${company}_${period}`
export default getCompositePeriod