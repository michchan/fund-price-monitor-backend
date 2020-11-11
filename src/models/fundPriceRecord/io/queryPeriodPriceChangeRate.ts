import isFunction from 'lodash/isFunction'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

import TableRange from '../TableRange.type'
import queryItems, { Output as O } from './queryItems'
import indexNames from '../constants/indexNames'
import { CompanyType } from '../FundPriceRecord.type'
import attributeNames from '../constants/attributeNames'
import { AggregatedRecordType } from '../FundPriceChangeRate.type'

const EXP_TIME_SK = ':timeSK' as string
export type Input = Omit<DocumentClient.QueryInput, 'TableName'>
export type PartialInput = Partial<Input>

export interface Output extends O {}
export interface Options {
  shouldQueryAll?: boolean;
  /** Default to current quarter of the current year */
  at?: TableRange;
  input?: PartialInput | ((defaultInput: Input) => PartialInput);
}
const queryPeriodPriceChangeRate = (
  company: CompanyType,
  recordType: AggregatedRecordType,
  period: string,
  {
    shouldQueryAll,
    at,
    input = {},
  }: Options = {},
): Promise<Output> => {
  const defaultInput: Input = {
    IndexName: indexNames.PERIOD_PRICE_CHANGE_RATE,
    ExpressionAttributeValues: { [EXP_TIME_SK]: `${recordType}_${company}_${period}` },
    KeyConditionExpression: `${attributeNames.PERIOD} = ${EXP_TIME_SK}`,
  }
  return queryItems({
    ...defaultInput,
    ...isFunction(input) ? input(defaultInput) : input,
  }, shouldQueryAll, at)
}

export default queryPeriodPriceChangeRate