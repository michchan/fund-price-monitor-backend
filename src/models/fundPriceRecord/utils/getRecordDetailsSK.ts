import topLevelKeysValues from '../constants/topLevelKeysValues'
import { FundPriceRecord } from '@michchan/fund-price-monitor-lib'

export interface Options extends Pick<FundPriceRecord, 'code' | 'company'> {}
const getRecordDetailsSK = ({
  company,
  code,
}: Options): string => `${topLevelKeysValues.RECORD_DETAILS_SK_PFX}_${company}_${code}`
export default getRecordDetailsSK