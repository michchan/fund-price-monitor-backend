import { Quarter } from 'simply-utils/dist/dateTime/getQuarter'

import batchDeleteItems from 'src/models/fundPriceRecord/io/batchDeleteItems'
import getCompositeSK from 'src/models/fundPriceRecord/utils/getCompositeSK'
import getCompositeSKFromChangeRate from 'src/models/fundPriceRecord/utils/getCompositeSKFromChangeRate'
import { Output } from './queryPrevItems'
import logObj from 'src/helpers/logObj'

const deleteItems = async (
  year: string | number,
  quarter: Quarter,
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
  await batchDeleteItems(prevLatestItems, year, quarter, getCompositeSK)

  // Log records to insert
  logObj(`prevWeekRateItems to remove (${prevWeekRateItems.length}): `, prevWeekRateItems)
  logObj(`prevMonthRateItems to remove (${prevMonthRateItems.length}): `, prevMonthRateItems)
  logObj(`prevQuarterRateItems to remove (${prevQuarterRateItems.length}): `, prevQuarterRateItems)

  // Remove previous change rates
  await batchDeleteItems([
    ...prevWeekRateItems,
    ...prevMonthRateItems,
    ...prevQuarterRateItems,
  ], year, quarter, getCompositeSKFromChangeRate)
}
export default deleteItems