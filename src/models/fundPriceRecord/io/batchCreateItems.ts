import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Quarter } from "simply-utils/dist/dateTime/getQuarter";

import { FundPriceRecord, FundPriceChangeRate } from '../FundPriceRecord.type';
import db from 'src/lib/AWS/dynamodb';
import { Result } from 'src/lib/AWS/dynamodb/batchWriteItems';
import getTableName from '../utils/getTableName';


type T = FundPriceRecord | FundPriceChangeRate
type R = DocumentClient.PutRequest | DocumentClient.DeleteRequest

/**
 * Return a list of properties of tables that have been created and match the criteria
 */
function batchCreateItems <Rec extends T, Req extends R> (
    records: Rec[],
    /** In YYYY format */
    year: string | number,
    quarter: Quarter,
    serializer: (record: Rec) => Req,
): Promise<Result | null> {
    return db.batchWriteItems(records, getTableName(year, quarter), 'put', serializer)
}
export default batchCreateItems