import { FundPriceRecord } from '../FundPriceRecord.type';
import serialize from '../utils/serialize';
import db from 'lib/db';
import { Result } from 'lib/db/batchCreateItems';


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