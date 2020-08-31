import { DynamoDB } from 'aws-sdk';

import { Input, Output } from "lib/AWS/dynamodb/scanAllItems"
import TableRange from '../TableRange.type';
import db from 'lib/AWS/dynamodb';
import getTableName from '../utils/getTableName';
import getQuarter from 'lib/helpers/getQuarter';



const scanQuarterRecords = (
    input: Omit<Input, 'TableName'>,
    /** Default to current quarter of the current year */
    from?: TableRange,
): Promise<Output> => {
    // Normalize params
    const _from = from || { year: new Date().getFullYear(), quarter: getQuarter() };

    return db.scanAllItems({
        ...input,
        TableName: getTableName(_from.year, _from.quarter),
    })
}

export default scanQuarterRecords