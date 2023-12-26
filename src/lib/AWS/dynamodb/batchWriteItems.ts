import { DynamoDB } from 'aws-sdk'
import batchWriteDynamodbItems, {
  BatchWriteDynamoDBItemsOptions as Opts,
  BatchWriteDynamoDBItemsResult,
} from 'simply-utils/AWS/batchWriteDynamodbItems'

import AWS from 'src/lib/AWS'

// Initialize
const docClient = new AWS.DynamoDB.DocumentClient({ convertEmptyValues: true })

const REQUESTS_MODE: Opts<unknown>['requestsMode'] = 'pipe'

export interface Options <T> {
  serialize?: (item: T) => DynamoDB.DocumentClient.AttributeMap;
  delay?: number;
}
export type Output = BatchWriteDynamoDBItemsResult

function batchWriteItems <T> (
  records: T[],
  tableName: string,
  mode: 'put' | 'delete',
  {
    serialize,
    delay,
  }: Options<T> = {},
): Promise<Output | null> {
  return batchWriteDynamodbItems({
    docClient,
    records,
    tableName,
    mode,
    serialize,
    requestsMode: REQUESTS_MODE,
    delay,
  })
}
export default batchWriteItems