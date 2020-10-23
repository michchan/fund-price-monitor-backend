import isFunction from 'lodash/isFunction'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

import queryItems, { Output as O } from './queryItems'
import attrs from '../constants/attributeNames'
import { CompanyType, FundPriceRecord } from '../FundPriceRecord.type'
import beginsWith from 'src/lib/AWS/dynamodb/expressionFunctions/beginsWith'
import getDateTimeDictionary from 'src/helpers/getDateTimeDictionary'
import between from 'src/lib/AWS/dynamodb/expressionFunctions/between'

const EXP_COM_CODE_PK = ':company_code' as string
const EXP_TIME_SK_PFX = ':time_SK' as string
const EXP_TIME_SK_START = ':timeSK_start' as string
const EXP_TIME_SK_END = ':timeSK_end' as string

export type Input = Omit<DocumentClient.QueryInput, 'TableName'>
export type PartialInput = Partial<Input>

export interface Output extends O {}
export interface Options {
  shouldQueryLatest?: boolean;
  shouldQueryAll?: boolean;
  /** ISO Timestamp */
  startTime?: string;
  endTime?: string;
  input?: PartialInput | ((defaultInput: Input) => PartialInput);
}
const querySingleFundRecords = (
  company: CompanyType,
  code: FundPriceRecord['code'],
  {
    shouldQueryLatest,
    shouldQueryAll,
    startTime,
    endTime,
    input = {},
  }: Options = {},
): Promise<Output> => {
  const startDate = startTime ? new Date(startTime) : new Date()
  const endDate = endTime ? new Date(endTime) : new Date()
  // Get table from
  const from = getDateTimeDictionary(startDate)
  // Construct TIME SK query
  const timeSKPfx = shouldQueryLatest ? 'shouldQueryLatest' : 'record'
  // Derive timeSK expression values based on conditions
  const timeSKValues = (() => {
    if (startTime || endTime) {
      const buf: Input['ExpressionAttributeValues'] = {}
      if (startTime) buf[EXP_TIME_SK_START] = `${timeSKPfx}_${company}_${startDate.toISOString()}`
      if (endTime) buf[EXP_TIME_SK_END] = `${timeSKPfx}_${company}_${endDate.toISOString()}`
      return buf
    }
    return { [EXP_TIME_SK_PFX]: timeSKPfx }
  })()
  // Derive timeSK expression based on conditions
  const timeSKExpression = (() => {
    if (startTime && endTime) return between(attrs.TIME_SK, EXP_TIME_SK_START, EXP_TIME_SK_END)
    if (startTime) return `${attrs.TIME_SK} >= ${EXP_TIME_SK_START}`
    if (endTime) return `${attrs.TIME_SK} <= ${EXP_TIME_SK_END}`
    return beginsWith(attrs.TIME_SK, EXP_TIME_SK_PFX)
  })()

  const defaultInput: Input = {
    ExpressionAttributeValues: {
      ...timeSKValues,
      [EXP_COM_CODE_PK]: `${company}_${code}`,
    },
    KeyConditionExpression: [
      `${attrs.COMPANY_CODE} = ${EXP_COM_CODE_PK}`,
      timeSKExpression,
    ].join(' AND '),
  }
  return queryItems({
    ...defaultInput,
    ...isFunction(input) ? input(defaultInput) : input,
  }, shouldQueryAll, from)
}

export default querySingleFundRecords