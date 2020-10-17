import { AWSError } from "aws-sdk"
import { DocumentClient } from "aws-sdk/clients/dynamodb"
import pick from "lodash/pick"
import { APIGatewayProxyResult } from "aws-lambda"

import { ListResponse } from "../Responses.type"


export type Output = 
  | DocumentClient.QueryOutput 
  | DocumentClient.ScanOutput

function createReadResponse <T> (
  error: null | AWSError,
  output?: Output,
): APIGatewayProxyResult {
  if (error) {
    console.log(`ERROR: `, JSON.stringify(error, null, 2))
    const body: ListResponse<T> = {
      result: false,
      error: pick(error, ['message', 'code'])
    }
    return {
      statusCode: error.statusCode,
      body: JSON.stringify(body, null, 2)
    }
  }

  const body: ListResponse<T> = {
    result: true,
    data: (output?.Items ?? []) as T[],
    lastEvaluatedKey: output?.LastEvaluatedKey ?? null,
  }
  return {
    statusCode: 200,
    body: JSON.stringify(body, null, 2)
  }
}

export default createReadResponse
