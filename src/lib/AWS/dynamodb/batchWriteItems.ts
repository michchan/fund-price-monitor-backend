import { DynamoDB } from 'aws-sdk'
import batchWriteDynamodbItems, {
  BatchWriteDynamoDBItemsOptions as Opts,
  BatchWriteDynamoDBItemsResult,
} from 'simply-utils/dist/AWS/batchWriteDynamodbItems'

import AWS from 'src/lib/AWS'

// Initialize
const docClient = new AWS.DynamoDB.DocumentClient({ convertEmptyValues: true })

type PT = DynamoDB.DocumentClient.PutRequest
type DT = DynamoDB.DocumentClient.DeleteRequest

const REQUESTS_MODE: Opts<unknown, PT | DT>['requestsMode'] = 'pipe'

export type Output = BatchWriteDynamoDBItemsResult

function batchWriteItems <T, RT extends PT | DT> (
  records: T[],
  tableName: string,
  mode: 'put' | 'delete',
  serialize?: (item: T) => RT,
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