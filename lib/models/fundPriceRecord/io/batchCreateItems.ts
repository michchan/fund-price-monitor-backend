import { FundPriceRecord } from '../FundPriceRecord.type';
import serialize from '../utils/serialize';
import db from 'lib/AWS/dynamodb';
import { Result } from 'lib/AWS/dynamodb/batchCreateItems';


/**
 * Return a list of properties of tables that have been created and match the criteria
 */
const batchCreateItems = (
    records: FundPriceRecord[],
    tableName: string,
): Promise<Result> => {
    return db.batchCreateItems(records, tableName, serialize)
}
export default batchCreateItems