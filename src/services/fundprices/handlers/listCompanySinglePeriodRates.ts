import { APIGatewayProxyHandler } from 'aws-lambda'
import { Quarter } from 'simply-utils/dist/dateTime/getQuarter'
import {
  AggregatedRecordType,
  ListCompanySinglePeriodRatesPathParams,
  ListCompanySinglePeriodRatesQueryParams,
  ListCompanySinglePeriodRatesResponse,
} from '@michchan/fund-price-monitor-lib'

import createReadResponse from '../helpers/createReadResponse'
import validateCompany from '../validators/validateCompany'
import validateKey from '../validators/validateKey'
import validatePeriod from '../validators/validatePeriod'
import queryPeriodPriceChangeRate from 'src/models/fundPriceRecord/io/queryPeriodPriceChangeRate'
import yearQuarterToTableRange from '../helpers/yearQuarterToTableRange'
import getCurrentYearAndQuarter from 'src/helpers/getCurrentYearAndQuarter'
import getDateTimeDictionary from 'src/helpers/getDateTimeDictionary'
import logObj from 'src/helpers/logObj'
import queryDetails from 'src/models/fundPriceRecord/io/queryDetails'
import mergeItemsWithDetails from 'src/models/fundPriceRecord/utils/mergeItemsWithDetails'

export type Res = ListCompanySinglePeriodRatesResponse

export type PathParams = ListCompanySinglePeriodRatesPathParams
export interface QueryParams extends ListCompanySinglePeriodRatesQueryParams {}

const getPeriodType = (path: string): AggregatedRecordType => {
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
const getYearQuarter = (periodType: AggregatedRecordType, period: string): string => {
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
    const [recordsOutput, detailsOutput] = await Promise.all([
      queryPeriodPriceChangeRate(company, periodType, period, {
        shouldQueryAll: false,
        at: tableRange,
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