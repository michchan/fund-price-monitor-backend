import topLevelKeysValues from '../constants/topLevelKeysValues'
import FundPriceRecord, { CompanyType } from '../FundPriceRecord.type'

type Code = FundPriceRecord['code']
const getRecordDetailsSK = (
  company: CompanyType,
  code: Code
): string => `${topLevelKeysValues.RECORD_DETAILS_SK_PFX}_${company}_${code}`
export default getRecordDetailsSK