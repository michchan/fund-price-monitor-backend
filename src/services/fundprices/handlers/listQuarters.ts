import { APIGatewayProxyHandler } from 'aws-lambda'
import { ListQuartersQueryParams, ListQuartersResponse } from '@michchan/fund-price-monitor-lib'

import createReadResponse from '../helpers/createReadResponse'
import listAllTables from 'src/lib/AWS/dynamodb/listAllTables'
import { Quarter } from 'simply-utils/dist/dateTime/getQuarter'
import validateYearQuarter from '../validators/validateYearQuarter'

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
    const { TableNames = [] } = await listAllTables(year, quarter as unknown as Quarter)

    return createReadResponse(event, null, {
      parsedItems: TableNames
        .map(tableName => (tableName.match(/[0-9]{4}_q[1-4]/)?.shift() ?? '').replace(/_q/i, '.'))
        .filter(v => !!v),
    })
  } catch (error) {
    // Send back failed response
    return createReadResponse(event, error)
  }
}