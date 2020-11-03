import { Quarter } from 'simply-utils/dist/dateTime/getQuarter'

import { FundPriceChangeRate, FundPriceRecord } from '../FundPriceRecord.type'
import batchWriteItems, { Output } from 'src/lib/AWS/dynamodb/batchWriteItems'
import attributeNames from '../constants/attributeNames'
import getTableName from '../utils/getTableName'

type T = FundPriceRecord | FundPriceChangeRate

/**
 * Return a list of properties of tables that have been created and match the criteria
 */
function batchDeleteItems <Rec extends T> (
  records: Rec[],
  /** In YYYY format */
  year: string | number,
  quarter: Quarter,
  getTimeSK: (record: Rec) => string,
): Promise<Output | null> {
  return batchWriteItems<Rec>(records, getTableName(year, quarter), 'delete', rec => ({
    [attributeNames.COMPANY_CODE]: `${rec.company}_${rec.code}`,
    [attributeNames.TIME_SK]: getTimeSK(rec),
  }))
}
export default batchDeleteItems