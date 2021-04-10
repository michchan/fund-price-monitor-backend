import { FundType } from '@michchan/fund-price-monitor-lib'

const whitelist: FundType[] = ['mpf']
const regex = new RegExp(`^(${whitelist.join('|')})$`, 'i')

function isValidFundType (maybeFundType: string): maybeFundType is FundType {
  return regex.test(maybeFundType)
}
export default isValidFundType