import { Quarter } from 'simply-utils/dist/dateTime/getQuarter'

import batchCreateItems from 'src/models/fundPriceRecord/io/batchCreateItems'
import serialize from 'src/models/fundPriceRecord/utils/serialize'
import serializeChangeRate from 'src/models/fundPriceRecord/utils/serializeChangeRate'
import { Output } from './deriveAggregatedItems'

const createItems = async (
  year: string | number,
  quarter: Quarter,
  ...rest: Output
) => {
  const [
    latestItems,
    weekRateItems,
    monthRateItems,
    quarterRateItems,
  ] = rest

  // Log records to insert
  console.log(`latestItems to insert (${latestItems.length}): `, JSON.stringify(latestItems, null, 2))

  // Batch create all aggregation items
  // Create latest records
  await batchCreateItems(latestItems, year, quarter, serialize)

  // Log records to insert
  console.log(`weekRateItems to insert (${weekRateItems.length}): `, JSON.stringify(weekRateItems, null, 2))
  console.log(`monthRateItems to insert (${weekRateItems.length}): `, JSON.stringify(monthRateItems, null, 2))
  console.log(`quarterRateItems to insert (${weekRateItems.length}): `, JSON.stringify(quarterRateItems, null, 2))

  // Create change rates
  await batchCreateItems([
    ...weekRateItems,
    ...monthRateItems,
    ...quarterRateItems,
  ], year, quarter, serializeChangeRate)
}
export default createItems