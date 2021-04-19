import { AWSError } from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import pick from 'lodash/pick'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import statusCodes from 'http-status-codes'
import { ListResponse } from '@michchan/fund-price-monitor-lib'
import getEnvVar from 'simply-utils/dist/utils/getEnvVar'

import stringify from 'src/helpers/stringify'

const apiCorsWhitelist = getEnvVar('API_CORS_WHITELIST')
const DEV_STAGE_NAME = 'dev'

const withCorsHeaders = (event: APIGatewayProxyEvent) => ({
  // Required for CORS support to work
  'Access-Control-Allow-Origin': event.requestContext.stage === DEV_STAGE_NAME
    ? '*'
    : apiCorsWhitelist,
  // Required for cookies, authorization headers with HTTPS
  'Access-Control-Allow-Credentials': true,
})

type BasedOutput =
  | DocumentClient.QueryOutput
  | DocumentClient.ScanOutput

export type Output <T> = BasedOutput & {
  parsedItems: T[];
}

function createReadResponse <T> (
  event: APIGatewayProxyEvent,
  error: null | AWSError,
  output?: Output<T>,
): APIGatewayProxyResult {
  if (error) {
    console.log('ERROR: ', stringify(error))
    const body: ListResponse<T> = {
      result: false,
      error: pick(error, ['message', 'code']),
    }
    return {
      statusCode: error.statusCode ?? statusCodes.INTERNAL_SERVER_ERROR,
      headers: withCorsHeaders(event),
      body: stringify(body),
    }
  }

  const body: ListResponse<T> = {
    result: true,
    data: output?.parsedItems ?? [],
    lastEvaluatedKey: output?.LastEvaluatedKey ?? null,
  }
  return {
    statusCode: statusCodes.OK,
    headers: withCorsHeaders(event),
    body: stringify(body),
  }
}

export default createReadResponse