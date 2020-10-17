import isFunction from "lodash/isFunction"
import { DocumentClient } from "aws-sdk/clients/dynamodb"

import TableRange from "../TableRange.type"
import queryItems from "./queryItems"
import indexNames from "../constants/indexNames"
import { AggregatedRecordType, CompanyType } from "../FundPriceRecord.type"
import attributeNames from "../constants/attributeNames"


const EXP_TIME_SK = `:timeSK` as string
export type Input = Omit<DocumentClient.QueryInput, 'TableName'>
export type PartialInput = Partial<Input>

const queryPeriodPriceChangeRate = (
  company: CompanyType,
  recordType: AggregatedRecordType, 
  period: string,
  all?: boolean,
  /** Default to current quarter of the current year */
  at?: TableRange,
  input: PartialInput | ((defaultInput: Input) => PartialInput) = {},
) => {
  const defaultInput: Input = {
    IndexName: indexNames.PERIOD_PRICE_CHANGE_RATE,
    ExpressionAttributeValues: {
      [EXP_TIME_SK]: `${recordType}_${company}_${period}`
    },
    KeyConditionExpression: `${attributeNames.PERIOD} = ${EXP_TIME_SK}`,
  }
  return queryItems({
    ...defaultInput,
    ...isFunction(input) ? input(defaultInput) : input,
  }, all, at)
}

export default queryPeriodPriceChangeRate
