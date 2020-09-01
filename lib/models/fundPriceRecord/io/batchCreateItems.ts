import { FundPriceRecord } from '../FundPriceRecord.type';
import serialize from '../utils/serialize';
import db from 'lib/AWS/dynamodb';
import { Result } from 'lib/AWS/dynamodb/batchWriteItems';


/**
 * Return a list of properties of tables that have been created and match the criteria
 */
const batchCreateItems = (
    records: FundPriceRecord[],
    tableName: string,
): Promise<Result> => {
    return db.batchWriteItems(records, tableName, 'put', serialize)
}
export default batchCreateItems