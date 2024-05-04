import { APIGatewayProxyHandler } from 'aws-lambda'
import { AWSError } from 'aws-sdk'
import {
  ListSingleFundRecordsPathParams,
  ListSingleFundRecordsQueryParams,
  ListSingleFundRecordsResponse,
  ListSingleFundRecordsTenor,
} from '@michchan/fund-price-monitor-lib'

import createReadResponse from '../helpers/createReadResponse'
import validateCompany from '../validators/validateCompany'
import validateKey from '../validators/validateKey'
import validateCode from '../validators/validateCode'
import queryDetails from 'src/models/fundPriceRecord/io/queryDetails'
import mergeItemsWithDetails from 'src/models/fundPriceRecord/utils/mergeItemsWithDetails'
import validateEnum from '../validators/validateEnum'
import { queryFundRecordsInQuarters } from 'src/models/fundPriceRecord/io/queryFundRecordsInQuarters'

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
    const queryParams = (event.queryStringParameters ?? {}) as unknown as QueryParams

    const { exclusiveStartKey } = queryParams
    const tenor = queryParams.tenor || ListSingleFundRecordsTenor.latest

    /** ----------- Validations ----------- */
    validateCompany(company)
    validateCode(code)

    if (tenor) validateEnum(tenor, 'tenor', Object.values(ListSingleFundRecordsTenor))
    if (exclusiveStartKey) validateKey(exclusiveStartKey, 'exclusiveStartKey')

    /** ----------- Query ----------- */
    const [recordsOutput, detailsOutput] = await Promise.all([
      queryFundRecordsInQuarters(company, code, tenor),
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
    return createReadResponse(event, error as AWSError)
  }
}