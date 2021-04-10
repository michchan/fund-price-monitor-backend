import getQuarter from 'simply-utils/dist/dateTime/getQuarter'
import { FundPriceRecord, FundPriceChangeRate } from '@michchan/fund-price-monitor-lib'

import scanAllItems, { Input, Output as O } from 'src/lib/AWS/dynamodb/scanAllItems'
import TableRange from '../TableRange.type'
import getTableName from '../utils/getTableName'
import scanPageItems from 'src/lib/AWS/dynamodb/scanItems'
import parseRecord from '../utils/parseRecord'

type TVariants = FundPriceRecord | FundPriceChangeRate
export interface Output <T extends TVariants = FundPriceRecord> extends O {
  parsedItems: T[];
}
const scanItems = async <T extends TVariants = FundPriceRecord> (
  input: Omit<Input, 'TableName'>,
  /** Scan all items regardless of page limits */
  shouldScanAll?: boolean,
  /** Default to current quarter of the current year */
  at?: TableRange,
  /** Default to parseRecord */
  // @ts-expect-error: @TODO: Fix type
  parser: ((attributes: DocumentClient.AttributeMap) => T) = parseRecord,
): Promise<Output<T>> => {
  // Normalize params
  const { year, quarter } = at || {
    year: new Date().getFullYear(),
    quarter: getQuarter(),
  }
  const query = shouldScanAll ? scanAllItems : scanPageItems

  const output = await query({
    ...input,
    TableName: getTableName(year, quarter),
  })

  return {
    ...output,
    parsedItems: (output?.Items ?? []).map(parser),
  }
}

export default scanItems