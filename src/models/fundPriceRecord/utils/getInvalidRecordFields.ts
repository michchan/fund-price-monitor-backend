import isStr from 'simply-utils/string/isStr'
import isNum from 'simply-utils/number/isNum'
import isNullOrUndef from 'simply-utils/validators/isNullOrUndef'
import isISOTimestamp from 'simply-utils/dateTime/isISOTimestamp'

import { FundPriceRecord, FundType, RecordType } from '@michchan/fund-price-monitor-lib'
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
      const isValid = (() => {
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
      })()
      return !isValid
    }) as K<FT, RT>[]
}
export default getInvalidRecordFields