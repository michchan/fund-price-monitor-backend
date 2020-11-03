import { DynamoDB } from 'aws-sdk'
import batchWriteDynamodbItems, {
  BatchWriteDynamoDBItemsOptions as Opts,
  BatchWriteDynamoDBItemsResult,
} from 'simply-utils/dist/AWS/batchWriteDynamodbItems'

import AWS from 'src/lib/AWS'

// Initialize
const docClient = new AWS.DynamoDB.DocumentClient({ convertEmptyValues: true })

const REQUESTS_MODE: Opts<unknown>['requestsMode'] = 'pipe'

export type Output = BatchWriteDynamoDBItemsResult

function batchWriteItems <T> (
  records: T[],
  tableName: string,
  mode: 'put' | 'delete',
  serialize?: (item: T) => DynamoDB.DocumentClient.AttributeMap,
): Promise<Output | null> {
  return batchWriteDynamodbItems({
    docClient,
    records,
    tableName,
    mode,
    serialize,
    requestsMode: REQUESTS_MODE,
  })
}
export default batchWriteItems