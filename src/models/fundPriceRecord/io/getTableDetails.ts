import getQuarter from "simply-utils/dist/dateTime/getQuarter";

import { Input, Output } from "src/lib/AWS/dynamodb/queryAllItems"
import TableRange from '../TableRange.type';
import db from 'src/lib/AWS/dynamodb';
import getTableName from '../utils/getTableName';
import { FundPriceTableDetails } from "../FundPriceRecord.type"
import attrs from "../constants/attributeNames";
import topLevelKeysValues from "../constants/topLevelKeysValues";


const EXP_PK = `:pk`
const EXP_SK = `:sk`

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
            [EXP_PK]: topLevelKeysValues.DETAILS_PK,
            [EXP_SK]: topLevelKeysValues.TABLE_DETAILS_SK,
        },
        KeyConditionExpression: [
            `${attrs.COMPANY_CODE} = ${EXP_PK}`,
            `${attrs.TIME_SK} = ${EXP_SK}`
        ].join(' AND ')
    });
    
    const item = (output.Items || [])[0];
    if (!item) throw new Error(`tableDetails row is not defined for table: ${TableName}`);
    console.log(JSON.stringify(output, null, 4))

    return {
        time: item[attrs.TIME_SK].split('@').pop(),
        companies: item[attrs.COMPANIES],
        fundTypes: item[attrs.FUND_TYPES],
    }
}

export default getTableDetails