import { FundPriceRecord, FundPriceChangeRate } from '../FundPriceRecord.type';
import serialize from '../utils/serialize';
import db from 'lib/AWS/dynamodb';
import { Result } from 'lib/AWS/dynamodb/batchWriteItems';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import attributeNames from '../constants/attributeNames';
import { Quarter } from 'lib/helpers/getQuarter';
import getTableName from '../utils/getTableName';


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
): Promise<Result> {
    return db.batchWriteItems<Rec, DocumentClient.DeleteRequest>(records, getTableName(year, quarter), 'delete', rec => ({ 
        Key: {
            [attributeNames.COMPANY_CODE]: `${rec.company}_${rec.code}`,
            [attributeNames.TIME_SK]: getTimeSK(rec)
        }
    }))
}
export default batchDeleteItems