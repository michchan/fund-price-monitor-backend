import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { FundDetails, FundPriceRecord, FundPriceChangeRate } from '@michchan/fund-price-monitor-lib'

import batchWriteItems, { Output } from 'src/lib/AWS/dynamodb/batchWriteItems'
import getTableName from '../utils/getTableName'
import TableRange from '../TableRange.type'

type T = FundPriceRecord | FundPriceChangeRate | FundDetails
export const DEFUALT_DELAY = 300

/**
 * Return a list of properties of tables that have been created and match the criteria
 */
function batchCreate <Rec extends T> (
  records: Rec[],
  { year, quarter }: TableRange,
  serialize: (record: Rec) => DocumentClient.AttributeMap,
  delay: number = DEFUALT_DELAY,
): Promise<Output | null> {
  return batchWriteItems(records, getTableName(year, quarter), 'put', {
    serialize,
    delay,
  })
}
export default batchCreate