import logObj from 'src/helpers/logObj'

import batchCreate from 'src/models/fundPriceRecord/io/batchCreate'
import TableRange from 'src/models/fundPriceRecord/TableRange.type'
import serializeRecord from 'src/models/fundPriceRecord/utils/serializeRecord'
import serializeChangeRate from 'src/models/fundPriceRecord/utils/serializeChangeRate'
import { Output } from './deriveAggregatedItems'

const createItems = async (
  tableRange: TableRange,
  isTest: boolean,
  ...rest: Output
): Promise<void> => {
  const [
    latestItems,
    weekRateItems,
    monthRateItems,
    quarterRateItems,
  ] = rest

  // Log records to insert
  logObj('latestItems to insert', latestItems)

  // Batch create all aggregation items
  // Create latest records
  if (!isTest) await batchCreate(latestItems, tableRange, serializeRecord)

  // Log records to insert
  logObj('weekRateItems to insert', weekRateItems)
  logObj('monthRateItems to insert', monthRateItems)
  logObj('quarterRateItems to insert', quarterRateItems)

  // Create change rates
  if (!isTest) {
    await batchCreate([
      ...weekRateItems,
      ...monthRateItems,
      ...quarterRateItems,
    ], tableRange, serializeChangeRate)
  }
}
export default createItems