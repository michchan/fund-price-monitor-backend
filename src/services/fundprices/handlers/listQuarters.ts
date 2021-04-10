import { APIGatewayProxyHandler } from 'aws-lambda'
import statusCodes from 'http-status-codes'
import { ListQuartersQueryParams, ListQuartersResponse, ListResponse } from '@michchan/fund-price-monitor-lib'

import createReadResponse from '../helpers/createReadResponse'
import listAllTables from 'src/lib/AWS/dynamodb/listAllTables'
import { Quarter } from 'simply-utils/dist/dateTime/getQuarter'
import validateYearQuarter from '../validators/validateYearQuarter'
import stringify from 'src/helpers/stringify'

export type Res = ListQuartersResponse

export interface QueryParams extends ListQuartersQueryParams {}

/**
 * Get list of quarters (YYYY.(1|2|3|4)) available for data resouces
 */
export const handler: APIGatewayProxyHandler = async event => {
  try {
    const { exclusiveStartQuarter } = (event.queryStringParameters ?? {}) as QueryParams
    console.log(event)

    /** ----------- Validations ----------- */
    if (exclusiveStartQuarter) validateYearQuarter(exclusiveStartQuarter, 'exclusiveStartQuarter')

    /** ----------- Query ----------- */

    // Extract query params
    const [year, quarter] = exclusiveStartQuarter?.split('.') ?? []

    // Query
    const { TableNames = [] } = await listAllTables(year, quarter as unknown as Quarter)
    // Create response
    const response: ListResponse<string> = {
      result: true,
      data: TableNames
        .map(tableName => (tableName.match(/[0-9]{4}_q[1-4]/)?.shift() ?? '').replace(/_q/i, '.'))
        .filter(v => !!v),
      lastEvaluatedKey: null,
    }
    return {
      statusCode: statusCodes.OK,
      body: stringify(response),
    }
  } catch (error) {
    // Send back failed response
    return createReadResponse(event, error)
  }
}