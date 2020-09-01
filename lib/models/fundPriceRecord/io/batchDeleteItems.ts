import { FundPriceRecord } from '../FundPriceRecord.type';
import serialize from '../utils/serialize';
import db from 'lib/AWS/dynamodb';
import { Result } from 'lib/AWS/dynamodb/batchWriteItems';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import attributeNames from '../constants/attributeNames';


/**
 * Return a list of properties of tables that have been created and match the criteria
 */
const batchDeleteItems = (
    records: FundPriceRecord[],
    tableName: string,
): Promise<Result> => {
    return db.batchWriteItems<FundPriceRecord, DocumentClient.DeleteRequest>(records, tableName, 'delete', rec => ({ 
        Key: {
            [attributeNames.COMPANY_CODE]: `${rec.company}_${rec.code}`,
            [attributeNames.TIME_SK]: `${rec.recordType}_${rec.company}_${rec.time}`
        }
    }))
}
export default batchDeleteItems