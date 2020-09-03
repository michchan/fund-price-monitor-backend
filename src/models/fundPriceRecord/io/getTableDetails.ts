import getQuarter from "simply-utils/dist/dateTime/getQuarter";

import { Input, Output } from "src/lib/AWS/dynamodb/queryAllItems"
import TableRange from '../TableRange.type';
import db from 'src/lib/AWS/dynamodb';
import getTableName from '../utils/getTableName';
import { FundPriceTableDetails } from "../FundPriceRecord.type"
import attrs from "../constants/attributeNames";
import topLevelKeysValues from "../constants/topLevelKeysValues";


const EXP_PK = `:pk`

const getTableDetails = async (
    input?: Omit<Input, 'TableName' | 'ExpressionAttributeValues' | 'KeyConditionExpression'>,
    /** Default to current quarter of the current year */
    from?: TableRange,
): Promise<FundPriceTableDetails> => {
    // Normalize params
    const _from = from || { year: new Date().getFullYear(), quarter: getQuarter() };
    const TableName = getTableName(_from.year, _from.quarter)

    const output = await db.queryAllItems({
        ...input,
        TableName,
        ExpressionAttributeValues: {
            [EXP_PK]: topLevelKeysValues.TABLE_DETAILS_PK
        },
        KeyConditionExpression: `${attrs.COMPANY_CODE} = ${EXP_PK}`
    });
    
    const item = (output.Items || [])[0];
    if (!item) throw new Error(`tableDetails row is not defined for table: ${TableName}`);

    return {
        time: item[attrs.TIME_SK].split('@').pop(),
        companies: item[attrs.COMPANIES],
        fundTypes: item[attrs.FUND_TYPES],
    }
}

export default getTableDetails