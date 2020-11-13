import { DocumentClient } from 'aws-sdk/clients/dynamodb'

import FundPriceRecord from '../FundPriceRecord.type'
import batchWriteItems, { Output } from 'src/lib/AWS/dynamodb/batchWriteItems'
import getTableName from '../utils/getTableName'
import TableRange from '../TableRange.type'
import FundPriceChangeRate from '../FundPriceChangeRate.type'
import FundDetails from '../FundDetails.type'

type T = FundPriceRecord | FundPriceChangeRate | FundDetails
export const DEFUALT_DELAY = 300

/**
 * Return a list of properties of tables that have been created and match the criteria
 */
function batchCreateItems <Rec extends T> (
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
export default batchCreateItems