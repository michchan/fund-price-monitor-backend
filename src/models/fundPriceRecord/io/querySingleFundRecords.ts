import isFunction from "lodash/isFunction";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

import indexNames from "../constants/indexNames";
import queryItems from "./queryItems";
import attrs from "../constants/attributeNames";
import { CompanyType, FundPriceRecord } from "../FundPriceRecord.type";
import TableRange from "../TableRange.type";
import beginsWith from "src/lib/AWS/dynamodb/expressionFunctions/beginsWith";


const EXP_COM_CODE_PK = `:company_code` as string
const EXP_TIME_SK = `:timeSK` as string

export type Input = Omit<DocumentClient.QueryInput, 'TableName'>
export type PartialInput = Partial<Input>

const querySingleFundRecords = (
    company: CompanyType,
    code: FundPriceRecord['code'],
    latest?: boolean,
    all?: boolean,
    /** Default to current quarter of the current year */
    from?: TableRange,
    input: PartialInput | ((defaultInput: Input) => PartialInput) = {},
) => {
    const defaultInput: Input = {
        ExpressionAttributeValues: {
            [EXP_COM_CODE_PK]: `${company}_${code}`,
            [EXP_TIME_SK]: latest ? 'latest' : 'record'
        },
        KeyConditionExpression: [
            `${attrs.COMPANY_CODE} = ${EXP_COM_CODE_PK}`,
            beginsWith(attrs.TIME_SK, EXP_TIME_SK)
        ].join(' AND '),
    }
    return queryItems({
        ...defaultInput,
        ...isFunction(input) ? input(defaultInput) : input,
    }, all, from);
}

export default querySingleFundRecords