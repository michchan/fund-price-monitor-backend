import { APIGatewayProxyHandler } from 'aws-lambda'
import mapValues from 'lodash/mapValues'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import {
  ListCompanyRecordsPathParams,
  ListCompanyRecordsQueryParams,
  ListCompanyRecordsResponse,
  CompanyType,
  RiskLevel,
} from '@michchan/fund-price-monitor-lib'

import attrs from 'src/models/fundPriceRecord/constants/attributeNames'
import beginsWith from 'src/lib/AWS/dynamodb/expressionFunctions/beginsWith'
import isValidRiskLevel from 'src/models/fundPriceRecord/utils/isValidRiskLevel'
import queryItemsByRiskLevel from 'src/models/fundPriceRecord/io/queryItemsByRiskLevel'
import queryItemsByCompany from 'src/models/fundPriceRecord/io/queryItemsByCompany'
import createReadResponse from '../helpers/createReadResponse'
import composeParameterErrMsg from '../helpers/composeParameterErrMsg'
import validateKey from '../validators/validateKey'
import validateCompany from '../validators/validateCompany'
import validateYearQuarter from '../validators/validateYearQuarter'
import yearQuarterToTableRange from '../helpers/yearQuarterToTableRange'
import TableRange from 'src/models/fundPriceRecord/TableRange.type'
import queryDetails from 'src/models/fundPriceRecord/io/queryDetails'
import mergeItemsWithDetails from 'src/models/fundPriceRecord/utils/mergeItemsWithDetails'
import createParameterError from '../helpers/createParameterError'

const EXP_COM = ':com_code'

interface QueryOptions {
  company: CompanyType;
  tableRange?: TableRange;
  exclusiveStartKey?: DocumentClient.QueryInput['ExclusiveStartKey'];
  riskLevel?: RiskLevel;
  shouldQueryLatest?: boolean;
  shouldQueryAll?: boolean;
}
const queryByRiskLevel = ({
  riskLevel,
  company,
  tableRange,
  exclusiveStartKey,
  shouldQueryLatest,
  shouldQueryAll = false,
}: QueryOptions) => {
  if (riskLevel) {
    // Query records with risk level and company constraint
    return queryItemsByRiskLevel(riskLevel, {
      shouldQueryLatest,
      shouldQueryAll,
      at: tableRange,
      input: defaultInput => ({
        ExclusiveStartKey: exclusiveStartKey,
        ExpressionAttributeValues: {
          ...defaultInput.ExpressionAttributeValues,
          // Add company constraint
          [EXP_COM]: company,
        },
        FilterExpression: [
          defaultInput.FilterExpression,
          beginsWith(attrs.COMPANY_CODE, EXP_COM),
        ].filter(v => v).join(' AND '),
      }),
    })
  }
  // Query records with company constraint
  return queryItemsByCompany(company, {
    at: tableRange,
    shouldQueryLatest,
    shouldQueryAll,
    input: {
      ExclusiveStartKey: exclusiveStartKey,
    },
  })
}

export type Res = ListCompanyRecordsResponse

export interface PathParams extends ListCompanyRecordsPathParams {}
export interface QueryParams extends ListCompanyRecordsQueryParams {}

/**
 * Get fund records of a company
 */
export const handler: APIGatewayProxyHandler = async event => {
  try {
    // Get path params
    const pathParams = (event.pathParameters ?? {}) as unknown as PathParams
    const { company } = pathParams

    // Get query params
    const queryParams = mapValues(event.queryStringParameters ?? {}, (value, key) => {
      if (['latest', 'all'].includes(key)) return value === 'true'
      return value
    }) as unknown as QueryParams

    const {
      riskLevel,
      latest: shouldQueryLatest,
      all: shouldQueryAll,
      exclusiveStartKey,
      quarter,
    } = queryParams

    /** ----------- Validations ----------- */
    validateCompany(company)
    if (riskLevel && !isValidRiskLevel(riskLevel))
      throw createParameterError(composeParameterErrMsg('riskLevel'))
    if (exclusiveStartKey) validateKey(exclusiveStartKey, 'exclusiveStartKey')
    if (quarter) validateYearQuarter(quarter, 'quarter')

    /** ----------- Query ----------- */
    // Get table range
    const tableRange = quarter ? yearQuarterToTableRange(quarter) : undefined
    // Get query handler by conditions
    const [recordsOutput, detailsOutput] = await Promise.all([
      queryByRiskLevel({
        company,
        tableRange,
        exclusiveStartKey,
        riskLevel,
        shouldQueryLatest,
        shouldQueryAll,
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
    return createReadResponse(event, error)
  }
}