import { Quarter } from 'simply-utils/dist/dateTime/getQuarter';

import { FundPriceRecord, FundPriceChangeRate } from '../FundPriceRecord.type';
import db from 'src/AWS/dynamodb';
import { Result } from 'src/AWS/dynamodb/batchWriteItems';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import attributeNames from '../constants/attributeNames';
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
): Promise<Result | null> {
    return db.batchWriteItems<Rec, DocumentClient.DeleteRequest>(records, getTableName(year, quarter), 'delete', rec => ({ 
        Key: {
            [attributeNames.COMPANY_CODE]: `${rec.company}_${rec.code}`,
            [attributeNames.TIME_SK]: getTimeSK(rec)
        }
    }))
}
export default batchDeleteItems