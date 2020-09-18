
import isFunction from "lodash/isFunction";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

import indexNames from "../constants/indexNames";
import queryItems from "./queryItems";
import attrs from "../constants/attributeNames";
import { CompanyType } from "../FundPriceRecord.type";
import TableRange from "../TableRange.type";
import beginsWith from "src/lib/AWS/dynamodb/expressionFunctions/beginsWith";


const EXP_COM_PK = `:company` as string
const EXP_TIME_SK = `:timeSK` as string

export type Input = Omit<DocumentClient.QueryInput, 'TableName'>
export type PartialInput = Partial<Input>

const queryItemsByCompany = (
    company: CompanyType,
    latest?: boolean,
    all?: boolean,
    /** Default to current quarter of the current year */
    from?: TableRange,
    input: PartialInput | ((defaultInput: Input) => PartialInput) = {},
) => {
    const defaultInput: Input = {
        IndexName: indexNames.RECORDS_BY_COMPANY,
        ExpressionAttributeValues: {
            [EXP_COM_PK]: company,
            [EXP_TIME_SK]: latest ? 'latest' : 'record'
        },
        KeyConditionExpression: `${attrs.COMPANY} = ${EXP_COM_PK}`,
        FilterExpression: beginsWith(attrs.TIME_SK, EXP_TIME_SK),
    }
    return queryItems({
        ...defaultInput,
        ...isFunction(input) ? input(defaultInput) : input,
    }, all, from);
}

export default queryItemsByCompany