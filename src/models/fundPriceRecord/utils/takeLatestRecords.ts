import { FundPriceRecord, FundPriceChangeRate, FundType } from '@michchan/fund-price-monitor-lib'
import compareISOTimestamp from 'simply-utils/dist/dateTime/compareISOTimestamp'

import getCompanyCodePK from './getCompanyCodePK'

export type ItemType =
  | FundPriceChangeRate<FundType>
  | FundPriceRecord<FundType>

const takeLatestRecords = (items: ItemType[]): ItemType[] => items.reduce((acc, curr) => {
  const prevIndex = acc.findIndex(each => getCompanyCodePK(each) === getCompanyCodePK(curr))
  if (prevIndex >= 0) {
    if (compareISOTimestamp(curr.time, acc[prevIndex].time) > 0) {
      const next = [...acc]
      next[prevIndex] = curr
      return next
    }
    return acc
  }
  return [...acc, curr]
}, [] as ItemType[])

export default takeLatestRecords