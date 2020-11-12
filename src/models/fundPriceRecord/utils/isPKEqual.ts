import FundPriceChangeRate from '../FundPriceChangeRate.type'
import FundPriceRecord from '../FundPriceRecord.type'
import getCompanyCodePK from './getCompanyCodePK'

type T = FundPriceRecord | FundPriceChangeRate
const isPKEqual = (
  based: T,
  compared: T,
): boolean => getCompanyCodePK(based) === getCompanyCodePK(compared)
export default isPKEqual