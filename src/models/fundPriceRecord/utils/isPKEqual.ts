import FundPriceChangeRate from '../FundPriceChangeRate.type'
import FundPriceRecord from '../FundPriceRecord.type'

type T = FundPriceRecord | FundPriceChangeRate
const isPKEqual = (
  based: T,
  compared: T,
): boolean => `${based.company}_${based.code}` === `${compared.company}_${compared.code}`
export default isPKEqual