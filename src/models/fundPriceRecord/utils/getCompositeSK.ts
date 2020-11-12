import FundPriceChangeRate from '../FundPriceChangeRate.type'
import FundPriceRecord from '../FundPriceRecord.type'

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