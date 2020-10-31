import isFunction from 'lodash/isFunction'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

import indexNames from '../constants/indexNames'
import queryItems, { Output as O } from './queryItems'
import attrs from '../constants/attributeNames'
import { CompanyType } from '../FundPriceRecord.type'
import TableRange from '../TableRange.type'
import beginsWith from 'src/lib/AWS/dynamodb/expressionFunctions/beginsWith'

export const EXP_COM_PK = ':company' as string
export const EXP_TIME_SK = ':timeSK' as string

export type Input = Omit<DocumentClient.QueryInput, 'TableName'>
export type PartialInput = Partial<Input>

export interface Output extends O {}
export interface Options {
  shouldQueryAll?: boolean;
  shouldQueryLatest?: boolean;
  /** Default to current quarter of the current year */
  at?: TableRange;
  input?: PartialInput | ((defaultInput: Input) => PartialInput);
}
const queryItemsByCompany = (
  company: CompanyType,
  {
    shouldQueryLatest,
    shouldQueryAll,
    at,
    input = {},
  }: Options = {},
): Promise<Output> => {
  const defaultInput: Input = {
    IndexName: indexNames.RECORDS_BY_COMPANY,
    ExpressionAttributeValues: {
      [EXP_COM_PK]: company,
      [EXP_TIME_SK]: shouldQueryLatest ? 'latest' : 'record',
    },
    KeyConditionExpression: `${attrs.COMPANY} = ${EXP_COM_PK}`,
    FilterExpression: beginsWith(attrs.TIME_SK, EXP_TIME_SK),
  }
  return queryItems({
    ...defaultInput,
    ...isFunction(input) ? input(defaultInput) : input,
  }, shouldQueryAll, at)
}

export default queryItemsByCompany