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
      if (key === 'latest') return value === 'true'
      return value
    }) as unknown as QueryParams
    const {
      latest: shouldQueryLatest,
      exclusiveStartKey,
      startTime,
      endTime,
    } = queryParams

    /** ----------- Validations ----------- */
    validateCompany(company)
    validateCode(code)
    if (startTime) validateTimestamp(startTime, 'startTime')
    if (endTime) validateTimestamp(endTime, 'endTime')
    if (startTime && endTime) validateTimestampRange(startTime, endTime)
    if (exclusiveStartKey) validateKey(exclusiveStartKey, 'exclusiveStartKey')

    /** ----------- Query ----------- */
    const [recordsOutput, detailsOutput] = await Promise.all([
      querySingleFundRecords(company, code, {
        shouldQueryLatest,
        shouldQueryAll: false,
        startTime,
        endTime,
        input: { ExclusiveStartKey: exclusiveStartKey },
      }),
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