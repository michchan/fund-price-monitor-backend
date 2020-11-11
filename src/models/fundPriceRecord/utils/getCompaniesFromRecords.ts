import uniq from 'lodash/uniq'
import FundPriceRecord, { CompanyType, FundType } from '../FundPriceRecord.type'

type RT = FundPriceRecord<FundType, 'record'>
const getCompaniesFromRecords = (records: RT[]): CompanyType[] => uniq(
  records.map(({ company }) => company)
)
export default getCompaniesFromRecords