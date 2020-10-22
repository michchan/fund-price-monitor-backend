import { FundPriceChangeRate } from '../FundPriceRecord.type'

const getCompositeSKFromChangeRate = ({
  recordType,
  company,
  period,
  time,
}: FundPriceChangeRate): string => `${recordType}_${company}_${period}@${time}`
export default getCompositeSKFromChangeRate