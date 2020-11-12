import FundPriceChangeRate from '../FundPriceChangeRate.type'
import FundPriceRecord from '../FundPriceRecord.type'

type T = Pick<FundPriceRecord | FundPriceChangeRate, 'company' | 'code'>
const getCompanyCodePK = ({ company, code }: T): string => `${company}_${code}`
export default getCompanyCodePK