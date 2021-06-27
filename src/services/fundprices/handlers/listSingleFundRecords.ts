import { APIGatewayProxyHandler } from 'aws-lambda'
import mapValues from 'lodash/mapValues'
import {
  ListSingleFundRecordsPathParams,
  ListSingleFundRecordsQueryParams,
  ListSingleFundRecordsResponse,
} from '@michchan/fund-price-monitor-lib'

import createReadResponse from '../helpers/createReadResponse'
import validateCompany from '../validators/validateCompany'
import validateKey from '../validators/validateKey'
import validateTimestamp from '../validators/validateTimestamp'
import querySingleFundRecords from 'src/models/fundPriceRecord/io/querySingleFundRecords'
import validateCode from '../validators/validateCode'
import validateTimestampRange from '../validators/validateTimestampRange'
import queryDetails from 'src/models/fundPriceRecord/io/queryDetails'
import mergeItemsWithDetails from 'src/models/fundPriceRecord/utils/mergeItemsWithDetails'
import validateYearQuarter from '../validators/validateYearQuarter'
import getYearQuarterFromTimestamp from '../helpers/getYearQuarterFromTimestamp'
import composeParameterErrMsg from '../helpers/composeParameterErrMsg'

const validateTimestampInQuarter = (
  timestamp: string,
  yearQuarter: string,
  [timestampName, yearQuarterName]: [string, string],
) => {
  if (getYearQuarterFromTimestamp(timestamp) !== yearQuarter) {
    throw new Error(composeParameterErrMsg(
      timestampName,
      'query',
      'custom',
      `must be within the same quarter defined with ${yearQuarterName}`
    ))
  }
}

export type Res = ListSingleFundRecordsResponse

export interface PathParams extends ListSingleFundRecordsPathParams {}

export interface QueryParams extends ListSingleFundRecordsQueryParams {}

/**
 * Get time-series recrods of a single fund
 */
export const handler: APIGatewayProxyHandler = async event => {
  try {
    // Get path params
    const pathParams = (event.pathParameters ?? {}) as unknown as PathParams
    const { company, code } = pathParams

    // Get query params
    const queryParams = mapValues(event.queryStringParameters ?? {}, (value, key) => {
      if (['latest', 'all'].includes(key)) return value === 'true'
      return value
    }) as unknown as QueryParams

    const {
      latest: shouldQueryLatest,
      all: shouldQueryAll,
      exclusiveStartKey,
      startTime,
      endTime,
      quarter,
    } = queryParams

    /** ----------- Validations ----------- */
    validateCompany(company)
    validateCode(code)

    if (startTime) validateTimestamp(startTime, 'startTime')
    if (endTime) validateTimestamp(endTime, 'endTime')
    if (quarter) validateYearQuarter(quarter, 'quarter')

    if (startTime && endTime) validateTimestampRange(startTime, endTime, ['startTime', 'endTime'])
    if (quarter && startTime) validateTimestampInQuarter(startTime, quarter, ['startTime', 'quarter'])
    if (quarter && endTime) validateTimestampInQuarter(endTime, quarter, ['endTime', 'quarter'])

    if (exclusiveStartKey) validateKey(exclusiveStartKey, 'exclusiveStartKey')

    /** ----------- Query ----------- */
    const [recordsOutput, detailsOutput] = await Promise.all([
      querySingleFundRecords(company, code, {
        shouldQueryLatest,
        shouldQueryAll,
        startTime,
        endTime,
        quarter,
        input: { ExclusiveStartKey: exclusiveStartKey },
      }),
      // Details items are non-time-series/mutable records.
      // Should always 'query all' records in order to map the details.
      queryDetails({ company, shouldQueryAll: true }),
    ])
    // Merge records and details
    const parsedItems = mergeItemsWithDetails(recordsOutput.parsedItems, detailsOutput.parsedItems)

    // Send back successful response
    return createReadResponse(event, null, { ...recordsOutput, parsedItems })
  } catch (error) {
    // Send back failed response
    return createReadResponse(event, error)
  }
}