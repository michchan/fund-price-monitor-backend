import { AWSError } from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import pick from 'lodash/pick'
import { APIGatewayProxyResult } from 'aws-lambda'
import statusCodes from 'http-status-codes'

import { ListResponse } from '../Responses.type'
import stringify from 'src/helpers/stringify'

export type Output =
  | DocumentClient.QueryOutput
  | DocumentClient.ScanOutput

function createReadResponse <T> (
  error: null | AWSError,
  output?: Output,
  parser?: (item: DocumentClient.AttributeMap) => T,
): APIGatewayProxyResult {
  if (error) {
    console.log('ERROR: ', stringify(error))
    const body: ListResponse<T> = {
      result: false,
      error: pick(error, ['message', 'code']),
    }
    return {
      statusCode: error.statusCode,
      body: stringify(body),
    }
  }

  const items = output?.Items ?? []
  const body: ListResponse<T> = {
    result: true,
    data: parser ? items.map(parser) : items as T[],
    lastEvaluatedKey: output?.LastEvaluatedKey ?? null,
  }
  return {
    statusCode: statusCodes.OK,
    body: stringify(body),
  }
}

export default createReadResponse