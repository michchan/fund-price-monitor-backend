import { DynamoDB } from 'aws-sdk'
import batchWriteDynamodbItems, { BatchWriteResult } from 'simply-utils/dist/AWS/batchWriteDynamodbItems'

import AWS from 'src/lib/AWS'

// Initialize
const docClient = new AWS.DynamoDB.DocumentClient({ convertEmptyValues: true })

type PT = DynamoDB.DocumentClient.PutRequest
type DT = DynamoDB.DocumentClient.DeleteRequest

export type Result = BatchWriteResult

async function batchWriteItems <T, RT extends PT | DT> (
  records: T[],
  tableName: string,
  mode: 'put' | 'delete',
  serialize?: (item: T) => RT,
): Promise<BatchWriteResult | null> {
  return batchWriteDynamodbItems(docClient, records, tableName, mode, serialize)
}
export default batchWriteItems
