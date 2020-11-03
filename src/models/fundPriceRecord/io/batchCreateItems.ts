import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { Quarter } from 'simply-utils/dist/dateTime/getQuarter'

import { FundPriceChangeRate, FundPriceRecord } from '../FundPriceRecord.type'
import batchWriteItems, { Output } from 'src/lib/AWS/dynamodb/batchWriteItems'
import getTableName from '../utils/getTableName'

type T = FundPriceRecord | FundPriceChangeRate

/**
 * Return a list of properties of tables that have been created and match the criteria
 */
function batchCreateItems <Rec extends T> (
  records: Rec[],
  /** In YYYY format */
  year: string | number,
  quarter: Quarter,
  serialize: (record: Rec) => DocumentClient.AttributeMap,
): Promise<Output | null> {
  return batchWriteItems(records, getTableName(year, quarter), 'put', {
    serialize,
    // @TODO: Add delay
  })
}
export default batchCreateItems