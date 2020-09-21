import isFunction from "lodash/isFunction";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

import queryItems from "./queryItems";
import attrs from "../constants/attributeNames";
import { CompanyType, FundPriceRecord } from "../FundPriceRecord.type";
import beginsWith from "src/lib/AWS/dynamodb/expressionFunctions/beginsWith";
import getDateTimeDictionary from "src/helpers/getDateTimeDictionary";
import between from "src/lib/AWS/dynamodb/expressionFunctions/between";


const EXP_COM_CODE_PK = `:company_code` as string
const EXP_TIME_SK_PFX = `:time_SK` as string
const EXP_TIME_SK_START = `:timeSK_start` as string
const EXP_TIME_SK_END = `:timeSK_end` as string

export type Input = Omit<DocumentClient.QueryInput, 'TableName'>
export type PartialInput = Partial<Input>

const querySingleFundRecords = (
    company: CompanyType,
    code: FundPriceRecord['code'],
    latest?: boolean,
    all?: boolean,
    /** ISO Timestamp */
    startTime?: string,
    endTime?: string,
    input: PartialInput | ((defaultInput: Input) => PartialInput) = {},
) => {
    const startDate = new Date(startTime ?? 0);
    const endDate = new Date(endTime ?? 0);    
    // Get table from
    const from = getDateTimeDictionary(startDate);

    // Construct TIME SK query
    const timeSKPfx = latest ? 'latest' : 'record'

    const defaultInput: Input = {
        ExpressionAttributeValues: {
            [EXP_COM_CODE_PK]: `${company}_${code}`,
            [EXP_TIME_SK_PFX]: timeSKPfx,
            [EXP_TIME_SK_START]: `${timeSKPfx}_${company}_${startDate.toISOString()}`,
            [EXP_TIME_SK_END]: `${timeSKPfx}_${company}_${endDate.toISOString()}`
        },
        KeyConditionExpression: [
            `${attrs.COMPANY_CODE} = ${EXP_COM_CODE_PK}`,
            startTime 
                ? between(attrs.TIME_SK, EXP_TIME_SK_START, EXP_TIME_SK_END) 
                : beginsWith(attrs.TIME_SK, EXP_TIME_SK_PFX)
        ].join(' AND '),
    }
    return queryItems({
        ...defaultInput,
        ...isFunction(input) ? input(defaultInput) : input,
    }, all, from);
}

export default querySingleFundRecords