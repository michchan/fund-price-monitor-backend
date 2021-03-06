import isFunction from 'lodash/isFunction'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { FundDetails, CompanyType } from '@michchan/fund-price-monitor-lib'

import queryItems, { Output as O } from './queryItems'
import attrs from '../constants/attributeNames'
import TableRange from '../TableRange.type'
import beginsWith from 'src/lib/AWS/dynamodb/expressionFunctions/beginsWith'
import topLevelKeysValues from '../constants/topLevelKeysValues'
import parseDetail from '../utils/parseDetail'

export const EXP_COM_CODE_PK = ':company_code' as string
export const EXP_TIME_SK_PFX = ':timeSK' as string

export type Input = Omit<DocumentClient.QueryInput, 'TableName'>
export type PartialInput = Partial<Input>

export interface Output extends O {
  parsedItems: FundDetails[];
}
export interface Options {
  company?: CompanyType;
  shouldQueryAll?: boolean;
  /** Default to current quarter of the current year */
  at?: TableRange;
  input?: PartialInput | ((defaultInput: Input) => PartialInput);
}

const queryDetails = async (
  {
    company,
    shouldQueryAll,
    at,
    input = {},
  }: Options = {},
): Promise<Output> => {
  const defaultInput: Input = {
    ExpressionAttributeValues: {
      [EXP_COM_CODE_PK]: topLevelKeysValues.DETAILS_PK,
      [EXP_TIME_SK_PFX]: `${topLevelKeysValues.RECORD_DETAILS_SK_PFX}_${company ?? ''}`,
    },
    KeyConditionExpression: [
      `${attrs.COMPANY_CODE} = ${EXP_COM_CODE_PK}`,
      beginsWith(attrs.TIME_SK, EXP_TIME_SK_PFX),
    ].join(' AND '),
  }
  const output = await queryItems({
    ...defaultInput,
    ...isFunction(input) ? input(defaultInput) : input,
  }, shouldQueryAll, at)

  return {
    ...output,
    parsedItems: (output?.Items ?? []).map(parseDetail),
  }
}

export default queryDetails