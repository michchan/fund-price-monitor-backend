import TableRange from "../TableRange.type"
import queryAllItems from "./queryAllItems"
import indexNames from "../constants/indexNames"
import { AggregatedRecordType, CompanyType } from "../FundPriceRecord.type"
import attributeNames from "../constants/attributeNames"


const EXP_TIME_SK = `:timeSK` as string

// @TODO: Handle paging mode
const queryPeriodPriceChangeRate = (
    company: CompanyType,
    recordType: AggregatedRecordType, 
    period: string,
    /** Default to current quarter of the current year */
    from?: TableRange
) => queryAllItems({
    IndexName: indexNames.PERIOD_PRICE_CHANGE_RATE,
    ExpressionAttributeValues: {
        [EXP_TIME_SK]: `${recordType}_${company}_${period}`
    },
    KeyConditionExpression: `${attributeNames.PERIOD} = ${EXP_TIME_SK}`
}, from)

export default queryPeriodPriceChangeRate