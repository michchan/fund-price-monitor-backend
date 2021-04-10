import { FundDetails } from '@michchan/fund-price-monitor-lib'
import getCompanyCodePK from 'src/models/fundPriceRecord/utils/getCompanyCodePK'

type FD = FundDetails
const mapAndReduceFundDetailsBatches = (batches: FD[][]): FD[] => {
  const records = batches.reduce((acc, curr) => [...acc, ...curr], [])
  return records.reduce((acc, curr) => {
    const prevIndex = acc.findIndex(item => getCompanyCodePK(item) === getCompanyCodePK(curr))
    if (prevIndex >= 0) {
      const prev = acc[prevIndex]
      const next: FD = {
        ...prev,
        ...curr,
        name: { ...prev.name, ...curr.name },
      }
      const nextAcc = [...acc]
      nextAcc[prevIndex] = next
      return nextAcc
    }
    return [...acc, curr]
  }, [] as FundDetails[])
}
export default mapAndReduceFundDetailsBatches