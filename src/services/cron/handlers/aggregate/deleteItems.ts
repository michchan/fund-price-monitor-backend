import batchDelete from 'src/models/fundPriceRecord/io/batchDelete'
import getCompositeSK from 'src/models/fundPriceRecord/utils/getCompositeSK'
import getCompositeSKFromChangeRate from 'src/models/fundPriceRecord/utils/getCompositeSKFromChangeRate'
import { Output } from './queryPrevItems'
import logObj from 'src/helpers/logObj'
import TableRange from 'src/models/fundPriceRecord/TableRange.type'

const deleteItems = async (
  tableRange: TableRange,
  ...rest: Output
): Promise<void> => {
  const [
    prevLatestItems,
    prevWeekRateItems,
    prevMonthRateItems,
    prevQuarterRateItems,
  ] = rest

  // Log records to remove
  logObj(`prevLatestItems to remove (${prevLatestItems.length}): `, prevLatestItems)

  // Remove previous latest records
  await batchDelete(prevLatestItems, tableRange, getCompositeSK)

  // Log records to insert
  logObj(`prevWeekRateItems to remove (${prevWeekRateItems.length}): `, prevWeekRateItems)
  logObj(`prevMonthRateItems to remove (${prevMonthRateItems.length}): `, prevMonthRateItems)
  logObj(`prevQuarterRateItems to remove (${prevQuarterRateItems.length}): `, prevQuarterRateItems)

  // Remove previous change rates
  await batchDelete([
    ...prevWeekRateItems,
    ...prevMonthRateItems,
    ...prevQuarterRateItems,
  ], tableRange, getCompositeSKFromChangeRate)
}
export default deleteItems