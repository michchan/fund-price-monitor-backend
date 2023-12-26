import { DynamoDB } from 'aws-sdk'
import queryOrScanAllDynamodbItems from 'simply-utils/AWS/queryOrScanAllDynamodbItems'

import AWS from '..'

// Initialize
const docClient = new AWS.DynamoDB.DocumentClient()
const DEFAULT_DELAY = 300

function queryOrScanAllItems <
  Input extends DynamoDB.DocumentClient.QueryInput | DynamoDB.DocumentClient.ScanInput,
  Output extends DynamoDB.DocumentClient.QueryOutput | DynamoDB.DocumentClient.ScanOutput
> (
  method: 'scan' | 'query',
  input: Input,
  delay: number = DEFAULT_DELAY,
): Promise<Output> {
  return queryOrScanAllDynamodbItems<Input, Output>(docClient, method, input, { delay })
}
export default queryOrScanAllItems