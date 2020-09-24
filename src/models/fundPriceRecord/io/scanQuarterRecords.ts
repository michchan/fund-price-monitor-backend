import getQuarter from "simply-utils/dist/dateTime/getQuarter";

import scanAllItems, { Input, Output } from "src/lib/AWS/dynamodb/scanAllItems"
import TableRange from '../TableRange.type';
import getTableName from '../utils/getTableName';



const scanQuarterRecords = (
    input: Omit<Input, 'TableName'>,
    /** Default to current quarter of the current year */
    at?: TableRange,
): Promise<Output> => {
    // Normalize params
    const _at = at || { year: new Date().getFullYear(), quarter: getQuarter() };

    return scanAllItems({
        ...input,
        TableName: getTableName(_at.year, _at.quarter),
    })
}

export default scanQuarterRecords