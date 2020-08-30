import { DynamoDB } from 'aws-sdk';

import { Result } from "lib/AWS/dynamodb/queryAllItems"
import TableRange from '../TableRange.type';
import db from 'lib/AWS/dynamodb';
import getTableName from '../utils/getTableName';
import getQuarter from 'lib/helpers/getQuarter';



const queryQuarterRecords = (
    input: Omit<DynamoDB.QueryInput, 'TableName'>,
    /** Default to current quarter of the current year */
    from?: TableRange,
): Promise<Result> => {
    // Normalize params
    const _from = from || { year: new Date().getFullYear(), quarter: getQuarter() };

    return db.queryAllItems({
        ...input,
        TableName: getTableName(_from.year, _from.quarter),
    })
}

export default queryQuarterRecords