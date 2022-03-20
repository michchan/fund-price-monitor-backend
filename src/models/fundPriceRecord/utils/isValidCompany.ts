import { CompanyType } from '@michchan/fund-price-monitor-lib'

const whitelist = Object.values(CompanyType)
const regex = new RegExp(`^(${whitelist.join('|')})$`, 'i')

function isValidCompany (maybeCompany: string): maybeCompany is CompanyType {
  return regex.test(maybeCompany)
}
export default isValidCompany