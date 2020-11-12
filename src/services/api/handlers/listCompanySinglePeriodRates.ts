import { APIGatewayProxyHandler } from 'aws-lambda'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { Quarter } from 'simply-utils/dist/dateTime/getQuarter'

import { ListResponse } from '../Responses.type'
import { CompanyType } from '../../../models/fundPriceRecord/FundPriceRecord.type'
import createReadResponse from '../helpers/createReadResponse'
import validateCompany from '../validators/validateCompany'
import validateKey from '../validators/validateKey'
import validatePeriod, { PeriodType } from '../validators/validatePeriod'
import queryPeriodPriceChangeRate from 'src/models/fundPriceRecord/io/queryPeriodPriceChangeRate'
import yearQuarterToTableRange from '../helpers/yearQuarterToTableRange'
import FundPriceChangeRate from 'src/models/fundPriceRecord/FundPriceChangeRate.type'
import parseChangeRate from 'src/models/fundPriceRecord/utils/parseChangeRate'
import getCurrentYearAndQuarter from 'src/helpers/getCurrentYearAndQuarter'
import getDateTimeDictionary from 'src/helpers/getDateTimeDictionary'
import logObj from 'src/helpers/logObj'

export type Res = ListResponse<FundPriceChangeRate>

export type PathParams = {
  company: CompanyType;
} & {
  /** Either `week`, `month` or `quarter` */
  [key in PeriodType]: string
}
export interface QueryParams {
  exclusiveStartKey?: DocumentClient.QueryInput['ExclusiveStartKey'];
}

const getPeriodType = (path: string): PeriodType => {
  switch (true) {
    case path.includes('quarter'):
      return 'quarter'
    case path.includes('month'):
      return 'month'
    case path.includes('week'):
    default:
      return 'week'
  }
}
/** Return format: YYYY.{1|2|3|4} */
const getYearQuarter = (periodType: PeriodType, period: string): string => {
  switch (periodType) {
    case 'quarter': return period
    default: {
      const [year, quarter] = ((): [string | number, Quarter] => {
        switch (periodType) {
          case 'month': {
            const { year, quarter } = getDateTimeDictionary(new Date(period))
            return [year, quarter]
          }
          case 'week': {
            const YYYYMM = period.split('.').shift() ?? ''
            const { year, quarter } = getDateTimeDictionary(new Date(YYYYMM))
            return [year, quarter]
          }
          default:
            return getCurrentYearAndQuarter()
        }
      })()
      return [year, quarter].join('.')
    }
  }
}

/**
 * Get rates records of a single fund
 */
export const handler: APIGatewayProxyHandler = async event => {
  try {
    // Get period type
    const periodType = getPeriodType(event.path)
    // Get path params
    const { company, [periodType]: period } = (event.pathParameters ?? {}) as unknown as PathParams
    // Get query params
    const { exclusiveStartKey } = (event.queryStringParameters ?? {}) as unknown as QueryParams

    // Get quarter by period
    const yearQuarter = getYearQuarter(periodType, period)

    /** ----------- Validations ----------- */
    validateCompany(company)
    validatePeriod(period, periodType)
    if (exclusiveStartKey) validateKey(exclusiveStartKey, 'exclusiveStartKey')

    /** ----------- Query ----------- */
    // Get table range
    const tableRange = yearQuarter ? yearQuarterToTableRange(yearQuarter) : undefined

    logObj('Params and input: ', { periodType, period, yearQuarter, tableRange, exclusiveStartKey })
    // Query
    const output = await queryPeriodPriceChangeRate(company, periodType, period, {
      shouldQueryAll: false,
      at: tableRange,
      input: { ExclusiveStartKey: exclusiveStartKey },
    })

    // Send back successful response
    return createReadResponse(null, output, parseChangeRate)
  } catch (error) {
    // Send back failed response
    return createReadResponse(error)
  }
}