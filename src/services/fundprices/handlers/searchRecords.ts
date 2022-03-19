import { APIGatewayProxyHandler } from 'aws-lambda'
import { AWSError } from 'aws-sdk'
import mapValues from 'lodash/mapValues'
import { SearchRecordsQueryParams, SearchRecordsResponse, RecordType } from '@michchan/fund-price-monitor-lib'

import createReadResponse from '../helpers/createReadResponse'
import { StructuredQuery } from '../StructuredQuery.type'
import parseQuery from '../helpers/parseQuery'
import validateKey from '../validators/validateKey'
import scanItems from 'src/models/fundPriceRecord/io/scanItems'
import attrs from 'src/models/fundPriceRecord/constants/attributeNames'
import beginsWith from 'src/lib/AWS/dynamodb/expressionFunctions/beginsWith'
import composeParameterErrMsg from '../helpers/composeParameterErrMsg'
import mapQueryToFilterExpressions from '../helpers/mapQueryToFilterExpressions'
import validateYearQuarter from '../validators/validateYearQuarter'
import yearQuarterToTableRange from '../helpers/yearQuarterToTableRange'
import queryDetails from 'src/models/fundPriceRecord/io/queryDetails'
import mergeItemsWithDetails from 'src/models/fundPriceRecord/utils/mergeItemsWithDetails'
import createParameterError from '../helpers/createParameterError'

const EXP_TIME_SK_PFX = ':timeSK_prefix' as string

export type Res = SearchRecordsResponse

export interface QueryParams extends SearchRecordsQueryParams {}

export interface QueryParamsParsed extends Omit<QueryParams, 'q'> {
  q?: StructuredQuery;
}

/**
 * Search all fund records
 */
export const handler: APIGatewayProxyHandler = async event => {
  try {
    // Get query params
    const queryParams = mapValues(event.queryStringParameters ?? {}, (value, key) => {
      if (['latest', 'all'].includes(key)) return value === 'true'
      if (key === 'q') return parseQuery(value ?? '')
      return value
    }) as unknown as QueryParamsParsed

    const {
      latest: shouldQueryLatest,
      all: shouldQueryAll,
      exclusiveStartKey,
      q,
      quarter,
    } = queryParams

    /** ----------- Validations ----------- */

    if (!q) throw createParameterError(composeParameterErrMsg('q', 'query'))
    if (exclusiveStartKey) validateKey(exclusiveStartKey, 'exclusiveStartKey')
    if (quarter) validateYearQuarter(quarter, 'quarter')

    /** ----------- Query ----------- */

    // Derive filters
    const [expNames, expValues, filterExp] = mapQueryToFilterExpressions(q)
    // Get table range
    const tableRange = quarter ? yearQuarterToTableRange(quarter) : undefined

    const recordType: RecordType = shouldQueryLatest ? 'latest' : 'record'
    // Query
    const [recordsOutput, detailsOutput] = await Promise.all([
      scanItems({
        ExclusiveStartKey: exclusiveStartKey,
        ExpressionAttributeNames: expNames,
        ExpressionAttributeValues: {
          ...expValues,
          [EXP_TIME_SK_PFX]: recordType,
        },
        FilterExpression: [
          beginsWith(attrs.TIME_SK, EXP_TIME_SK_PFX),
          ...filterExp,
        ].join(' AND '),
      }, shouldQueryAll, tableRange),
      queryDetails({ shouldQueryAll: true }),
    ])
    // Merge records and details
    const parsedItems = mergeItemsWithDetails(recordsOutput.parsedItems, detailsOutput.parsedItems)

    // Send back successful response
    return createReadResponse(event, null, { ...recordsOutput, parsedItems })
  } catch (error) {
    // Send back failed response
    return createReadResponse(event, error as AWSError)
  }
}