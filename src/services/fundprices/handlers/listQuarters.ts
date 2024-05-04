import { APIGatewayProxyHandler } from 'aws-lambda'
import { AWSError } from 'aws-sdk'
import { ListQuartersQueryParams, ListQuartersResponse } from '@michchan/fund-price-monitor-lib'

import createReadResponse from '../helpers/createReadResponse'
import validateYearQuarter from '../validators/validateYearQuarter'
import { listQuarters } from 'src/models/fundPriceRecord/io/listQuarters'

export type Res = ListQuartersResponse

export interface QueryParams extends ListQuartersQueryParams {}

/**
 * Get list of quarters (YYYY.(1|2|3|4)) available for data resources
 */
export const handler: APIGatewayProxyHandler = async event => {
  try {
    const { exclusiveStartQuarter } = (event.queryStringParameters ?? {}) as QueryParams

    /** ----------- Validations ----------- */
    if (exclusiveStartQuarter) validateYearQuarter(exclusiveStartQuarter, 'exclusiveStartQuarter')

    /** ----------- Query ----------- */

    // Extract query params
    const [year, quarter] = exclusiveStartQuarter?.split('.') ?? []

    // Query
    const quarters = await listQuarters(year, quarter)

    return createReadResponse(event, null, {
      parsedItems: quarters,
    })
  } catch (error) {
    // Send back failed response
    return createReadResponse(event, error as AWSError)
  }
}