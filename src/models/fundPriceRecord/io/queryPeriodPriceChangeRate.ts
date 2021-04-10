import isFunction from 'lodash/isFunction'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { CompanyType, AggregatedRecordType, FundPriceChangeRate } from '@michchan/fund-price-monitor-lib'

import TableRange from '../TableRange.type'
import queryItems, { Output as O } from './queryItems'
import indexNames from '../constants/indexNames'
import attributeNames from '../constants/attributeNames'
import getCompositePeriod from '../utils/getCompositePeriod'
import parseChangeRate from '../utils/parseChangeRate'

const EXP_PERIOD = ':period' as string
export type Input = Omit<DocumentClient.QueryInput, 'TableName'>
export type PartialInput = Partial<Input>

export interface Output extends O {
  parsedItems: FundPriceChangeRate[];
}
export interface Options {
  shouldQueryAll?: boolean;
  /** Default to current quarter of the current year */
  at?: TableRange;
  input?: PartialInput | ((defaultInput: Input) => PartialInput);
}
const queryPeriodPriceChangeRate = async (
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
    ExpressionAttributeValues: {
      [EXP_PERIOD]: getCompositePeriod({ recordType, company, period }),
    },
    KeyConditionExpression: `${attributeNames.PERIOD} = ${EXP_PERIOD}`,
  }
  const output = await queryItems({
    ...defaultInput,
    ...isFunction(input) ? input(defaultInput) : input,
  }, shouldQueryAll, at)
  return {
    ...output,
    parsedItems: (output?.Items ?? []).map(parseChangeRate),
  }
}

export default queryPeriodPriceChangeRate