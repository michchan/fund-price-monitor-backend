import { Quarter } from "simply-utils/dist/dateTime/getQuarter"

import batchDeleteItems from "src/models/fundPriceRecord/io/batchDeleteItems"
import getCompositeSK from "src/models/fundPriceRecord/utils/getCompositeSK"
import getCompositeSKFromChangeRate from "src/models/fundPriceRecord/utils/getCompositeSKFromChangeRate"
import { Output } from './queryPrevItems'


const deleteItems = async (
  year: string | number,
  quarter: Quarter,
  ...rest: Output
) => {
  const [
    prevLatestItems,
    prevWeekRateItems,
    prevMonthRateItems,
    prevQuarterRateItems
  ] = rest

  // Log records to remove
  console.log(`prevLatestItems to remove (${prevLatestItems.length}): `, JSON.stringify(prevLatestItems, null, 2))

  // Remove previous latest records
  await batchDeleteItems(prevLatestItems, year, quarter, getCompositeSK)

  // Log records to insert
  console.log(`prevWeekRateItems to remove (${prevWeekRateItems.length}): `, JSON.stringify(prevWeekRateItems, null, 2))
  console.log(`prevMonthRateItems to remove (${prevMonthRateItems.length}): `, JSON.stringify(prevMonthRateItems, null, 2))
  console.log(`prevQuarterRateItems to remove (${prevQuarterRateItems.length}): `, JSON.stringify(prevQuarterRateItems, null, 2))

  // Remove previous change rates
  await batchDeleteItems([
    ...prevWeekRateItems, 
    ...prevMonthRateItems, 
    ...prevQuarterRateItems
  ], year, quarter, getCompositeSKFromChangeRate)
}
export default deleteItems