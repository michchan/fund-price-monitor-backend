import { APIGatewayProxyHandler } from 'aws-lambda'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

import { ListResponse } from '../Responses.type'
import {
  CompanyType,
  FundPriceChangeRate,
} from '../../../models/fundPriceRecord/FundPriceRecord.type'
import createReadResponse from '../helpers/createReadResponse'
import validateCompany from '../validators/validateCompany'
import validateKey from '../validators/validateKey'
import validatePeriod, { PeriodType } from '../validators/validatePeriod'
import queryPeriodPriceChangeRate from 'src/models/fundPriceRecord/io/queryPeriodPriceChangeRate'
import validateYearQuarter from '../validators/validateYearQuarter'
import yearQuarterToTableRange from '../helpers/yearQuarterToTableRange'

export type Res = ListResponse<FundPriceChangeRate>

export type PathParams = {
  company: CompanyType;
} & {
  /** Either `week`, `month` or `quarter` */
  [key in PeriodType]: string
}
export interface QueryParams {
  exclusiveStartKey?: DocumentClient.QueryInput['ExclusiveStartKey'];
  /** Format: YYYY.(1|2|3|4) */
  quarter?: string;
}

/**
 * Get rates records of a single fund
 */
export const handler: APIGatewayProxyHandler = async event => {
  try {
    // Get period type
    const periodType = ((path: string): PeriodType => {
      switch (true) {
        case path.includes('quarter'):
          return 'quarter'
        case path.includes('month'):
          return 'month'
        case path.includes('week'):
        default:
          return 'week'
      }
    })(event.path)

    // Get path params
    const { company, [periodType]: period } = (event.pathParameters ?? {}) as unknown as PathParams
    // Get query params
    const {
      exclusiveStartKey,
      quarter,
    } = (event.queryStringParameters ?? {}) as unknown as QueryParams

    /** ----------- Validations ----------- */
    validateCompany(company)
    validatePeriod(period, periodType)
    if (exclusiveStartKey) validateKey(exclusiveStartKey, 'exclusiveStartKey')
    if (quarter) validateYearQuarter(quarter, 'quarter')

    /** ----------- Query ----------- */
    // Get table range
    const tableRange = quarter ? yearQuarterToTableRange(quarter) : undefined
    // Query
    const output = await queryPeriodPriceChangeRate(company, periodType, period, {
      shouldQueryAll: false,
      at: tableRange,
      input: { ExclusiveStartKey: exclusiveStartKey },
    })

    // Send back successful response
    return createReadResponse(null, output)
  } catch (error) {
    // Send back failed response
    return createReadResponse(error)
  }
}