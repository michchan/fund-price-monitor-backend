
import indexNames from "../constants/indexNames";
import queryAllItems from "./queryAllItems";
import db from "src/lib/AWS/dynamodb";
import attrs from "../constants/attributeNames";
import { CompanyType } from "../FundPriceRecord.type";
import TableRange from "../TableRange.type";


const EXP_COM_PK = `:company` as string
const EXP_TIME_SK = `:timeSK` as string

// @TODO: Handle paging mode
const queryItemsByCompany = (
    company: CompanyType,
    latest?: boolean,
    /** Default to current quarter of the current year */
    from?: TableRange,
) => queryAllItems({
    IndexName: indexNames.RECORDS_BY_COMPANY,
    ExpressionAttributeValues: {
        [EXP_COM_PK]: company,
        [EXP_TIME_SK]: latest ? 'latest' : 'record'
    },
    KeyConditionExpression: `${attrs.COMPANY} = ${EXP_COM_PK}`,
    FilterExpression: db.expressionFunctions.beginsWith(attrs.TIME_SK, EXP_TIME_SK)
}, from);

export default queryItemsByCompany