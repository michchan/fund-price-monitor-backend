import { FundPriceRecord, FundPriceChangeRate } from '@michchan/fund-price-monitor-lib'

type T = Pick<FundPriceRecord | FundPriceChangeRate, 'company' | 'code'>
const getCompanyCodePK = ({ company, code }: T): string => `${company}_${code}`
export default getCompanyCodePK