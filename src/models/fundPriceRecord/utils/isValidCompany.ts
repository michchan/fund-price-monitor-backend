import { CompanyType } from "../FundPriceRecord.type"


const whitelist: CompanyType[] = ['aia', 'manulife']
const regex = new RegExp(`^(${whitelist.join('|')})$`, 'i')

const isValidCompany = (maybeCompany: string): maybeCompany is CompanyType => {
    return regex.test(maybeCompany)
}
export default isValidCompany