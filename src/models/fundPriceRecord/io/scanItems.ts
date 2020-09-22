import getQuarter from "simply-utils/dist/dateTime/getQuarter";

import scanAllItems, { Input, Output } from "src/lib/AWS/dynamodb/scanAllItems"
import TableRange from '../TableRange.type';
import getTableName from '../utils/getTableName';
import _scanItems from 'src/lib/AWS/dynamodb/scanItems'



const scanItems = (
    input: Omit<Input, 'TableName'>,
    all?: boolean,
    /** Default to current quarter of the current year */
    from?: TableRange,
): Promise<Output> => {
    // Normalize params
    const _from = from || { year: new Date().getFullYear(), quarter: getQuarter() };
    const query = all ? scanAllItems : _scanItems

    return query({
        ...input,
        TableName: getTableName(_from.year, _from.quarter),
    });
}

export default scanItems