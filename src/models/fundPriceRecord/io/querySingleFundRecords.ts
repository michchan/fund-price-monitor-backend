import isFunction from 'lodash/isFunction'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { FundPriceRecord, FundPriceChangeRate, CompanyType, RecordType } from '@michchan/fund-price-monitor-lib'

import queryItems, { Output as O } from './queryItems'
import attrs from '../constants/attributeNames'
import beginsWith from 'src/lib/AWS/dynamodb/expressionFunctions/beginsWith'
import getDateTimeDictionary from 'src/helpers/getDateTimeDictionary'
import between from 'src/lib/AWS/dynamodb/expressionFunctions/between'
import getCompanyCodePK from '../utils/getCompanyCodePK'
import getCompositeSK from '../utils/getCompositeSK'
import parseRecord from '../utils/parseRecord'
import yearQuarterToTableRange from 'src/services/fundprices/helpers/yearQuarterToTableRange'

const EXP_COM_CODE_PK = ':company_code' as string
const EXP_TIME_SK_PFX = ':time_SK' as string
const EXP_TIME_SK_START = ':timeSK_start' as string
const EXP_TIME_SK_END = ':timeSK_end' as string

export type Input = Omit<DocumentClient.QueryInput, 'TableName'>
export type PartialInput = Partial<Input>

type TVariants = FundPriceRecord | FundPriceChangeRate
export type Parser <T> = (attributes: DocumentClient.AttributeMap) => T

export interface Output <T extends TVariants = FundPriceRecord> extends O {
  parsedItems: T[];
}
export interface Options <T extends TVariants = FundPriceRecord> {
  shouldQueryLatest?: boolean;
  shouldQueryAll?: boolean;
  /** ISO Timestamp */
  startTime?: string;
  endTime?: string;
  /** YYYY.nthQuarter */
  quarter?: string;
  input?: PartialInput | ((defaultInput: Input) => PartialInput);
  /** Default to parseRecord */
  parser?: Parser<T>;
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

const querySingleFundRecords = async <T extends TVariants = FundPriceRecord> (
  company: CompanyType,
  code: FundPriceRecord['code'],
  {
    shouldQueryLatest,
    shouldQueryAll,
    startTime,
    endTime,
    quarter,
    input = {},
    parser = parseRecord as Parser<T>,
  }: Options<T> = {},
): Promise<Output<T>> => {
  const startDate = startTime ? new Date(startTime) : new Date()
  // Get table at
  const tableAt = quarter
    ? yearQuarterToTableRange(quarter)
    : getDateTimeDictionary(startDate)
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
  const output = await queryItems({
    ...defaultInput,
    ...isFunction(input) ? input(defaultInput) : input,
  }, shouldQueryAll, tableAt)

  return {
    ...output,
    parsedItems: (output?.Items ?? []).map(parser),
  }
}

export default querySingleFundRecords