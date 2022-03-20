import uniq from 'lodash/uniq'
import { FundPriceRecord, CompanyType, FundType, RecordType } from '@michchan/fund-price-monitor-lib'

type RT = FundPriceRecord<FundType, RecordType.record>
const getCompaniesFromRecords = (records: RT[]): CompanyType[] => uniq(
  records.map(({ company }) => company)
)
export default getCompaniesFromRecords