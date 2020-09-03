import { DynamoDB } from 'aws-sdk';
import getQuarter from "simply-utils/dist/dateTime/getQuarter";

import { Input, Output } from "src/AWS/dynamodb/queryAllItems"
import TableRange from '../TableRange.type';
import db from 'src/AWS/dynamodb';
import getTableName from '../utils/getTableName';



const queryAllItems = (
    input: Omit<Input, 'TableName'>,
    /** Default to current quarter of the current year */
    from?: TableRange,
): Promise<Output> => {
    // Normalize params
    const _from = from || { year: new Date().getFullYear(), quarter: getQuarter() };

    return db.queryAllItems({
        ...input,
        TableName: getTableName(_from.year, _from.quarter),
    })
}

export default queryAllItems