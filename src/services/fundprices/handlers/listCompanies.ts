import { APIGatewayProxyHandler } from 'aws-lambda'
import { AWSError } from 'aws-sdk'
import { ListCompaniesResponse, ListCompaniesQueryParams } from '@michchan/fund-price-monitor-lib'

import getTableDetails from 'src/models/fundPriceRecord/io/getTableDetails'
import createReadResponse from '../helpers/createReadResponse'
import validateYearQuarter from '../validators/validateYearQuarter'
import yearQuarterToTableRange from 'src/services/fundprices/helpers/yearQuarterToTableRange'

export type Res = ListCompaniesResponse

export interface QueryParams extends ListCompaniesQueryParams {}

/**
 * Get list of companies available for data resources of current quarter
 */
export const handler: APIGatewayProxyHandler = async event => {
  try {
    const { quarter } = (event.queryStringParameters ?? {}) as QueryParams

    /** ----------- Validations ----------- */
    if (quarter) validateYearQuarter(quarter, 'quarter')

    /** ----------- Query ----------- */
    const tableRange = quarter ? yearQuarterToTableRange(quarter) : undefined
    const { companies } = await getTableDetails(undefined, tableRange)

    return createReadResponse(event, null, {
      parsedItems: companies,
    })
  } catch (error) {
    // Send back failed response
    return createReadResponse(event, error as AWSError)
  }
}