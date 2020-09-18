import getQuarter from "simply-utils/dist/dateTime/getQuarter";

import queryAllItems, { Input, Output } from "src/lib/AWS/dynamodb/queryAllItems"
import TableRange from '../TableRange.type';
import getTableName from '../utils/getTableName';
import _queryItems from 'src/lib/AWS/dynamodb/queryItems'



const queryItems = (
    input: Omit<Input, 'TableName'>,
    all?: boolean,
    /** Default to current quarter of the current year */
    from?: TableRange,
): Promise<Output> => {
    // Normalize params
    const _from = from || { year: new Date().getFullYear(), quarter: getQuarter() };
    const query = all ? queryAllItems : _queryItems

    return query({
        ...input,
        TableName: getTableName(_from.year, _from.quarter),
    });
}

export default queryItems