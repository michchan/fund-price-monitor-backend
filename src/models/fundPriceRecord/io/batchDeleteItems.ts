import FundPriceRecord from '../FundPriceRecord.type'
import FundPriceChangeRate from '../FundPriceChangeRate.type'
import batchWriteItems, { Output } from 'src/lib/AWS/dynamodb/batchWriteItems'
import attributeNames from '../constants/attributeNames'
import getTableName from '../utils/getTableName'
import TableRange from '../TableRange.type'
import { DEFAULT_DELAY } from '../utils/pipeByCompany'

type T = FundPriceRecord | FundPriceChangeRate
export const DEFUALT_DELAY = 300

/**
 * Return a list of properties of tables that have been created and match the criteria
 */
function batchDeleteItems <Rec extends T> (
  records: Rec[],
  { year, quarter }: TableRange,
  getTimeSK: (record: Rec) => string,
  delay: number = DEFAULT_DELAY,
): Promise<Output | null> {
  return batchWriteItems<Rec>(records, getTableName(year, quarter), 'delete', {
    serialize: rec => ({
      [attributeNames.COMPANY_CODE]: `${rec.company}_${rec.code}`,
      [attributeNames.TIME_SK]: getTimeSK(rec),
    }),
    delay,
  })
}
export default batchDeleteItems