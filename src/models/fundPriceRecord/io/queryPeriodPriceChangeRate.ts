import TableRange from "../TableRange.type"
import queryItems from "./queryItems"
import indexNames from "../constants/indexNames"
import { AggregatedRecordType, CompanyType } from "../FundPriceRecord.type"
import attributeNames from "../constants/attributeNames"
import { DocumentClient } from "aws-sdk/clients/dynamodb"


const EXP_TIME_SK = `:timeSK` as string

const queryPeriodPriceChangeRate = (
    company: CompanyType,
    recordType: AggregatedRecordType, 
    period: string,
    all?: boolean,
    /** Default to current quarter of the current year */
    from?: TableRange,
    input: Partial<DocumentClient.QueryInput> = {},
) => queryItems({
    IndexName: indexNames.PERIOD_PRICE_CHANGE_RATE,
    ExpressionAttributeValues: {
        [EXP_TIME_SK]: `${recordType}_${company}_${period}`
    },
    KeyConditionExpression: `${attributeNames.PERIOD} = ${EXP_TIME_SK}`,
    ...input,
}, all, from)

export default queryPeriodPriceChangeRate