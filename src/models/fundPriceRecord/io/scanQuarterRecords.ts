import getQuarter from "simply-utils/dist/dateTime/getQuarter";

import { Input, Output } from "src/AWS/dynamodb/scanAllItems"
import TableRange from '../TableRange.type';
import db from 'src/AWS/dynamodb';
import getTableName from '../utils/getTableName';



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