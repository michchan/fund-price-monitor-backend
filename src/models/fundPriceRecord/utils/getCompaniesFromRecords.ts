import uniq from 'lodash/uniq'
import { FundPriceRecord, CompanyType, FundType } from '@michchan/fund-price-monitor-lib'

type RT = FundPriceRecord<FundType, 'record'>
const getCompaniesFromRecords = (records: RT[]): CompanyType[] => uniq(
  records.map(({ company }) => company)
)
export default getCompaniesFromRecords