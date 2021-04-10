import { FundPriceRecord, FundPriceChangeRate } from '@michchan/fund-price-monitor-lib'
import getCompanyCodePK from './getCompanyCodePK'

type T = FundPriceRecord | FundPriceChangeRate
const isPKEqual = (
  based: T,
  compared: T,
): boolean => getCompanyCodePK(based) === getCompanyCodePK(compared)
export default isPKEqual