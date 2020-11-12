import isFunction from 'lodash/isFunction'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

import queryItems, { Output as O } from './queryItems'
import attrs from '../constants/attributeNames'
import FundPriceRecord, { CompanyType, RecordType } from '../FundPriceRecord.type'
import beginsWith from 'src/lib/AWS/dynamodb/expressionFunctions/beginsWith'
import getDateTimeDictionary from 'src/helpers/getDateTimeDictionary'
import between from 'src/lib/AWS/dynamodb/expressionFunctions/between'
import getCompanyCodePK from '../utils/getCompanyCodePK'
import getCompositeSK from '../utils/getCompositeSK'

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

const getTimeSKValues = (
  company: CompanyType,
  recordType: RecordType,
  startTime?: string,
  endTime?: string,
) => {
  if (startTime || endTime) {
    const thisStartTime = (startTime ? new Date(startTime) : new Date()).toISOString()
    const thisEndTime = (endTime ? new Date(endTime) : new Date()).toISOString()
    const buf: Input['ExpressionAttributeValues'] = {}

    const input = { recordType, company }
    if (startTime) buf[EXP_TIME_SK_START] = getCompositeSK({ ...input, time: thisStartTime })
    if (endTime) buf[EXP_TIME_SK_END] = getCompositeSK({ ...input, time: thisEndTime })
    return buf
  }
  return { [EXP_TIME_SK_PFX]: recordType }
}

const getTimeSKExpression = (startTime?: string, endTime?: string) => {
  if (startTime && endTime) return between(attrs.TIME_SK, EXP_TIME_SK_START, EXP_TIME_SK_END)
  if (startTime) return `${attrs.TIME_SK} >= ${EXP_TIME_SK_START}`
  if (endTime) return `${attrs.TIME_SK} <= ${EXP_TIME_SK_END}`
  return beginsWith(attrs.TIME_SK, EXP_TIME_SK_PFX)
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
  // Get table from
  const from = getDateTimeDictionary(startDate)
  // Construct TIME SK query
  const recordType: RecordType = shouldQueryLatest ? 'latest' : 'record'
  // Derive timeSK expression values based on conditions
  const timeSKValues = getTimeSKValues(company, recordType, startTime, endTime)
  // Derive timeSK expression based on conditions
  const timeSKExpression = getTimeSKExpression(startTime, endTime)

  const defaultInput: Input = {
    ExpressionAttributeValues: {
      ...timeSKValues,
      [EXP_COM_CODE_PK]: getCompanyCodePK({ company, code }),
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