import getQuarter from "simply-utils/dist/dateTime/getQuarter";

import { Input, Output } from "src/lib/AWS/dynamodb/queryAllItems"
import TableRange from '../TableRange.type';
import db from 'src/lib/AWS/dynamodb';
import getTableName from '../utils/getTableName';



const queryItems = (
    input: Omit<Input, 'TableName'>,
    all?: boolean,
    /** Default to current quarter of the current year */
    from?: TableRange,
): Promise<Output> => {
    // Normalize params
    const _from = from || { year: new Date().getFullYear(), quarter: getQuarter() };
    const query = all ? db.queryAllItems : db.queryItems

    return query({
        ...input,
        TableName: getTableName(_from.year, _from.quarter),
    });
}

export default queryItems