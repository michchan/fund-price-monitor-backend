import { DynamoDB } from 'aws-sdk'
import queryOrScanAllDynamodbItems from 'simply-utils/dist/AWS/queryOrScanAllDynamodbItems'

import AWS from '..'

// Initialize
const docClient = new AWS.DynamoDB.DocumentClient()

function queryOrScanAllItems <
  Input extends DynamoDB.DocumentClient.QueryInput | DynamoDB.DocumentClient.ScanInput,
  Output extends DynamoDB.DocumentClient.QueryOutput | DynamoDB.DocumentClient.ScanOutput
> (
  method: 'scan' | 'query',
  input: Input,
): Promise<Output> {
  return queryOrScanAllDynamodbItems<Input, Output>(docClient, method, input)
}
export default queryOrScanAllItems