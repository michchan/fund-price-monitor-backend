import { APIGatewayProxyHandler } from 'aws-lambda'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import mapValues from 'lodash/mapValues'

import { ListResponse } from '../Responses.type'
import FundPriceRecord, { CompanyType } from '../../../models/fundPriceRecord/FundPriceRecord.type'
import createReadResponse from '../helpers/createReadResponse'
import validateCompany from '../validators/validateCompany'
import validateKey from '../validators/validateKey'
import validateTimestamp from '../validators/validateTimestamp'
import querySingleFundRecords from 'src/models/fundPriceRecord/io/querySingleFundRecords'
import validateCode from '../validators/validateCode'
import validateTimestampRange from '../validators/validateTimestampRange'
import queryDetails from 'src/models/fundPriceRecord/io/queryDetails'
import mergeItemsWithDetails from 'src/models/fundPriceRecord/utils/mergeItemsWithDetails'

export type Res = ListResponse<FundPriceRecord>

export interface PathParams {
  company: CompanyType;
  code: FundPriceRecord['code'];
}

export interface QueryParams {
  latest?: boolean;
  exclusiveStartKey?: DocumentClient.QueryInput['ExclusiveStartKey'];
  /** ISO timestamp */
  startTime?: string;
  /** ISO timestamp */
  endTime?: string;
}

/**
 * Get time-series recrods of a single fund
 */
export const handler: APIGatewayProxyHandler = async event => {
  try {
    // Get path params
    const pathParams = (event.pathParameters ?? {}) as unknown as PathParams
    const { company, code } = pathParams

    // Get query params
    const queryParams = mapValues(event.queryStringParameters ?? {}, (value, key) => {
      if (key === 'latest') return value === 'true'
      return value
    }) as unknown as QueryParams
    const {
      latest: shouldQueryLatest,
      exclusiveStartKey,
      startTime,
      endTime,
    } = queryParams

    /** ----------- Validations ----------- */
    validateCompany(company)
    validateCode(code)
    if (startTime) validateTimestamp(startTime, 'startTime')
    if (endTime) validateTimestamp(endTime, 'endTime')
    if (startTime && endTime) validateTimestampRange(startTime, endTime)
    if (exclusiveStartKey) validateKey(exclusiveStartKey, 'exclusiveStartKey')

    /** ----------- Query ----------- */
    const [recordsOutput, detailsOutput] = await Promise.all([
      querySingleFundRecords(company, code, {
        shouldQueryLatest,
        shouldQueryAll: false,
        startTime,
        endTime,
        input: { ExclusiveStartKey: exclusiveStartKey },
      }),
      queryDetails({ company, shouldQueryAll: true }),
    ])
    // Merge records and details
    const parsedItems = mergeItemsWithDetails(recordsOutput.parsedItems, detailsOutput.parsedItems)

    // Send back successful response
    return createReadResponse(null, { ...recordsOutput, parsedItems })
  } catch (error) {
    // Send back failed response
    return createReadResponse(error)
  }
}