import isFunction from "lodash/isFunction"
import { DocumentClient } from "aws-sdk/clients/dynamodb"

import indexNames from "../constants/indexNames"
import queryItems from "./queryItems"
import attrs from "../constants/attributeNames"
import { RiskLevel } from "../FundPriceRecord.type"
import TableRange from "../TableRange.type"
import beginsWith from "src/lib/AWS/dynamodb/expressionFunctions/beginsWith"


const EXP_RISK_LEVEL_PK = `:riskLevel` as string
const EXP_TIME_SK = `:timeSK` as string

export type Input = Omit<DocumentClient.QueryInput, 'TableName'>
export type PartialInput = Partial<Input>

const queryItemsByRiskLevel = (
  riskLevel: RiskLevel,
  latest?: boolean,
  all?: boolean,
  /** Default to current quarter of the current year */
  at?: TableRange,
  input: PartialInput | ((defaultInput: Input) => PartialInput) = {},
) => {
  const defaultInput: Input = {
    IndexName: indexNames.RECORDS_BY_RISK_LEVEL,
    ExpressionAttributeValues: {
      [EXP_RISK_LEVEL_PK]: riskLevel,
      [EXP_TIME_SK]: latest ? 'latest' : 'record'
    },
    KeyConditionExpression: `${attrs.RISK_LEVEL} = ${EXP_RISK_LEVEL_PK}`,
    FilterExpression: beginsWith(attrs.TIME_SK, EXP_TIME_SK),
  }
  return queryItems({
    ...defaultInput,
    ...isFunction(input) ? input(defaultInput) : input,
  }, all, at)
}

export default queryItemsByRiskLevel
