import isFunction from 'lodash/isFunction'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { FundPriceRecord, FundPriceChangeRate, CompanyType, RecordType } from '@michchan/fund-price-monitor-lib'

import indexNames from '../constants/indexNames'
import queryItems, { Output as O } from './queryItems'
import attrs from '../constants/attributeNames'
import TableRange from '../TableRange.type'
import beginsWith from 'src/lib/AWS/dynamodb/expressionFunctions/beginsWith'
import parseRecord from '../utils/parseRecord'

export const EXP_COM_PK = ':company' as string
export const EXP_TIME_SK_PFX = ':timeSK' as string

export type Input = Omit<DocumentClient.QueryInput, 'TableName'>
export type PartialInput = Partial<Input>

type TVariants = FundPriceRecord | FundPriceChangeRate

export type Parser<T> = (attributes: DocumentClient.AttributeMap) => T
export interface Output <T extends TVariants = FundPriceRecord> extends O {
  parsedItems: T[];
}
export interface Options <T extends TVariants = FundPriceRecord> {
  shouldQueryAll?: boolean;
  shouldQueryLatest?: boolean;
  /** Default to current quarter of the current year */
  at?: TableRange;
  input?: PartialInput | ((defaultInput: Input) => PartialInput);
  /** Default to parseRecord */
  parser?: Parser<T>;
}
const queryItemsByCompany = async <T extends TVariants = FundPriceRecord> (
  company: CompanyType,
  {
    shouldQueryLatest,
    shouldQueryAll,
    at,
    input = {},
    parser = parseRecord as Parser<T>,
  }: Options<T> = {},
): Promise<Output<T>> => {
  const recordType: RecordType = shouldQueryLatest ? 'latest' : 'record'
  const defaultInput: Input = {
    IndexName: indexNames.RECORDS_BY_COMPANY,
    ExpressionAttributeValues: {
      [EXP_COM_PK]: company,
      [EXP_TIME_SK_PFX]: recordType,
    },
    KeyConditionExpression: `${attrs.COMPANY} = ${EXP_COM_PK}`,
    FilterExpression: beginsWith(attrs.TIME_SK, EXP_TIME_SK_PFX),
  }
  const output = await queryItems({
    ...defaultInput,
    ...isFunction(input) ? input(defaultInput) : input,
  }, shouldQueryAll, at)

  return {
    ...output,
    parsedItems: (output?.Items ?? []).map(parser),
  }
}

export default queryItemsByCompany