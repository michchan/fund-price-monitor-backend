import isStr from 'simply-utils/dist/string/isStr'
import isNum from 'simply-utils/dist/number/isNum'
import isNullOrUndef from 'simply-utils/dist/validators/isNullOrUndef'
import isISOTimestamp from 'simply-utils/dist/dateTime/isISOTimestamp'

import FundPriceRecord, { FundType, RecordType } from '../FundPriceRecord.type'
import isValidCompany from './isValidCompany'
import isValidRiskLevel from './isValidRiskLevel'
import isValidFundType from './isValidFundType'
import isValidDate from './isValidDate'

type K <
  FT extends FundType = FundType,
  RT extends RecordType = RecordType
> = keyof FundPriceRecord<FT, RT>

function getInvalidRecordFields <
  FT extends FundType = FundType,
  RT extends RecordType = RecordType
> (record: FundPriceRecord<FT, RT>): K<FT, RT>[] {
  return Object.keys(record)
    .filter(key => {
      const value = record[key as K<FT, RT>]
      switch (key) {
        case 'company': return isValidCompany(value as string)
        case 'code': return isStr(value)
        case 'updatedDate': return isValidDate(value as string)
        case 'price': return isNum(value)
        case 'priceChangeRate': return isNullOrUndef(value) || isNum(value)
        case 'riskLevel': return isValidRiskLevel(value as string)
        case 'time': return isISOTimestamp(value as string)
        case 'fundType': return isValidFundType(value as string)
        default:
          return true
      }
    }) as K<FT, RT>[]
}
export default getInvalidRecordFields