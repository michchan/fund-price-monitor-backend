import getQuarter from 'simply-utils/dist/dateTime/getQuarter'

import scanAllItems, { Input, Output } from 'src/lib/AWS/dynamodb/scanAllItems'
import TableRange from '../TableRange.type'
import getTableName from '../utils/getTableName'
import scanPageItems from 'src/lib/AWS/dynamodb/scanItems'

const scanItems = (
  input: Omit<Input, 'TableName'>,
  /** Scan all items regardless of page limits */
  shouldScanAll?: boolean,
  /** Default to current quarter of the current year */
  at?: TableRange,
): Promise<Output> => {
  // Normalize params
  const { year, quarter } = at || {
    year: new Date().getFullYear(),
    quarter: getQuarter(),
  }
  const query = shouldScanAll ? scanAllItems : scanPageItems

  return query({
    ...input,
    TableName: getTableName(year, quarter),
  })
}

export default scanItems