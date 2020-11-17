import isFunction from 'lodash/isFunction'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

import indexNames from '../constants/indexNames'
import queryItems, { Output as O } from './queryItems'
import attrs from '../constants/attributeNames'
import FundPriceRecord, { RiskLevel } from '../FundPriceRecord.type'
import TableRange from '../TableRange.type'
import beginsWith from 'src/lib/AWS/dynamodb/expressionFunctions/beginsWith'
import FundPriceChangeRate from '../FundPriceChangeRate.type'

const EXP_RISK_LEVEL_PK = ':riskLevel' as string
const EXP_TIME_SK = ':timeSK' as string

export type Input = Omit<DocumentClient.QueryInput, 'TableName'>
export type PartialInput = Partial<Input>

type TVariants = FundPriceRecord | FundPriceChangeRate
export interface Output <T extends TVariants = FundPriceRecord> extends O {
  parsedItems: T[];
}
export interface Options <T extends TVariants = FundPriceRecord> {
  shouldQueryLatest?: boolean;
  shouldQueryAll?: boolean;
  /** Default to current quarter of the current year */
  at?: TableRange;
  input?: PartialInput | ((defaultInput: Input) => PartialInput);
  /** Default to parseRecord */
  parser?: ((attributes: DocumentClient.AttributeMap) => T);
}
const queryItemsByRiskLevel = async <T extends TVariants = FundPriceRecord> (
  riskLevel: RiskLevel,
  {
    shouldQueryLatest,
    shouldQueryAll,
    at,
    input = {},
    // @ts-expect-error: @TODO: Fix type
    parser = parseRecord,
  }: Options<T> = {},
): Promise<Output<T>> => {
  const defaultInput: Input = {
    IndexName: indexNames.RECORDS_BY_RISK_LEVEL,
    ExpressionAttributeValues: {
      [EXP_RISK_LEVEL_PK]: riskLevel,
      [EXP_TIME_SK]: shouldQueryLatest ? 'latest' : 'record',
    },
    KeyConditionExpression: `${attrs.RISK_LEVEL} = ${EXP_RISK_LEVEL_PK}`,
    FilterExpression: beginsWith(attrs.TIME_SK, EXP_TIME_SK),
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

export default queryItemsByRiskLevel