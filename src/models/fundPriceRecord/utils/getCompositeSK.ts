import { FundPriceRecord, FundPriceChangeRate } from '@michchan/fund-price-monitor-lib'

type T = Pick<FundPriceRecord | FundPriceChangeRate,
| 'recordType'
| 'company'
| 'time'
>
const getCompositeSK = ({
  recordType,
  company,
  time,
}: T): string => `${recordType}_${company}_${time}`
export default getCompositeSK