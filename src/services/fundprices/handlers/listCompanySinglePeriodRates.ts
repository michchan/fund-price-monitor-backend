import { APIGatewayProxyHandler } from 'aws-lambda'
import { AWSError } from 'aws-sdk'
import { Quarter } from 'simply-utils/dateTime/getQuarter'
import {
  AggregatedRecordType,
  ListCompanySinglePeriodRatesPathParams,
  ListCompanySinglePeriodRatesQueryParams,
  ListCompanySinglePeriodRatesResponse,
} from '@michchan/fund-price-monitor-lib'
import mapValues from 'lodash/mapValues'

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
import parseWeekPeriodParam from '../helpers/parseWeekPeriodParam'
import attributeNames from 'src/models/fundPriceRecord/constants/attributeNames'
import validateCode from '../validators/validateCode'
import getCompanyCodePK from 'src/models/fundPriceRecord/utils/getCompanyCodePK'

const EXP_COM_CODE = ':company_code' as string

export type Res = ListCompanySinglePeriodRatesResponse

export type PathParams = ListCompanySinglePeriodRatesPathParams
export interface QueryParams extends ListCompanySinglePeriodRatesQueryParams {}

const getPeriodType = (path: string): AggregatedRecordType => {
  switch (true) {
    case path.includes('quarter'):
      return AggregatedRecordType.quarter
    case path.includes('month'):
      return AggregatedRecordType.month
    case path.includes('week'):
    default:
      return AggregatedRecordType.week
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
    const { company, [periodType]: _period } = (event.pathParameters ?? {}) as unknown as PathParams

    // Get query params
    const queryParams = mapValues(event.queryStringParameters ?? {}, (value, key) => {
      if (['latest', 'all'].includes(key)) return value === 'true'
      return value
    }) as unknown as QueryParams

    // Get query params
    const {
      exclusiveStartKey,
      all: shouldQueryAll,
      code,
    } = queryParams

    /** ----------- Validations ----------- */
    validateCompany(company)
    validatePeriod(_period, periodType)
    if (exclusiveStartKey) validateKey(exclusiveStartKey, 'exclusiveStartKey')
    if (code) validateCode(code)

    /** ----------- Param Parsing ----------- */
    const period = periodType === 'week' ? parseWeekPeriodParam(_period) : _period
    // Get quarter by period
    const yearQuarter = getYearQuarter(periodType, period)

    /** ----------- Query ----------- */
    // Get table range
    const tableRange = yearQuarter ? yearQuarterToTableRange(yearQuarter) : undefined

    logObj('Params and input: ', { periodType, period, yearQuarter, tableRange, exclusiveStartKey })
    // Query
    const [recordsOutput, detailsOutput] = await Promise.all([
      queryPeriodPriceChangeRate(company, periodType, period, {
        shouldQueryAll,
        at: tableRange,
        input: defaultInput => ({
          ...defaultInput,
          ExclusiveStartKey: exclusiveStartKey,
          ...code ? {
            ExpressionAttributeValues: {
              ...defaultInput.ExpressionAttributeValues,
              [EXP_COM_CODE]: getCompanyCodePK({ company, code }),
            },
            FilterExpression: [
              defaultInput.FilterExpression,
              `${attributeNames.COMPANY_CODE} = ${EXP_COM_CODE}`,
            ].filter(v => v).join(' AND '),
          } : {},
        }),
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
    return createReadResponse(event, error as AWSError)
  }
}