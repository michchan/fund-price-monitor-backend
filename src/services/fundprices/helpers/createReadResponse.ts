import { AWSError } from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import pick from 'lodash/pick'
import { APIGatewayProxyResult } from 'aws-lambda'
import statusCodes from 'http-status-codes'
import { ListResponse } from '@michchan/fund-price-monitor-lib'

import stringify from 'src/helpers/stringify'

type BasedOutput =
  | DocumentClient.QueryOutput
  | DocumentClient.ScanOutput

export type Output <T> = BasedOutput & {
  parsedItems: T[];
}

function createReadResponse <T> (
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
    body: stringify(body),
  }
}

export default createReadResponse