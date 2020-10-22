import { Quarter } from 'simply-utils/dist/dateTime/getQuarter'
import logObj from 'src/helpers/logObj'

import batchCreateItems from 'src/models/fundPriceRecord/io/batchCreateItems'
import serialize from 'src/models/fundPriceRecord/utils/serialize'
import serializeChangeRate from 'src/models/fundPriceRecord/utils/serializeChangeRate'
import { Output } from './deriveAggregatedItems'

const createItems = async (
  year: string | number,
  quarter: Quarter,
  ...rest: Output
): Promise<void> => {
  const [
    latestItems,
    weekRateItems,
    monthRateItems,
    quarterRateItems,
  ] = rest

  // Log records to insert
  logObj(`latestItems to insert (${latestItems.length}): `, latestItems)

  // Batch create all aggregation items
  // Create latest records
  await batchCreateItems(latestItems, year, quarter, serialize)

  // Log records to insert
  logObj(`weekRateItems to insert (${weekRateItems.length}): `, weekRateItems)
  logObj(`monthRateItems to insert (${weekRateItems.length}): `, monthRateItems)
  logObj(`quarterRateItems to insert (${weekRateItems.length}): `, quarterRateItems)

  // Create change rates
  await batchCreateItems([
    ...weekRateItems,
    ...monthRateItems,
    ...quarterRateItems,
  ], year, quarter, serializeChangeRate)
}
export default createItems