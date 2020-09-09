import { DynamoDB } from 'aws-sdk';
import chunk from 'lodash/chunk'

import AWS from 'src/lib/AWS'


// Initialize
const docClient = new AWS.DynamoDB.DocumentClient({ convertEmptyValues: true });

export type ChunkResult = DynamoDB.DocumentClient.BatchWriteItemOutput
export type Result = ChunkResult[]

type PT = DynamoDB.DocumentClient.PutRequest
type DT = DynamoDB.DocumentClient.DeleteRequest

/**
 * Return a list of properties of tables that have been created and match the criteria
 */
async function batchWriteItems <T, RT extends PT | DT> (
    records: T[],
    tableName: string,
    mode: 'put' | 'delete',
    serialize?: (item: T) => RT,
): Promise<Result | null> {
    if (records.length === 0) return null

    // Chunk records by 25 which is the max number of items DynamoDB can batch write.
    const chunks = chunk(records, 25)
    // Send batch requests for each chunk
    return Promise.all(
        chunks.map((chunkedRecords, index): Promise<ChunkResult> => {
            // Create items
            const items = chunkedRecords.map(rec => ({
                [mode === 'put' ? 'PutRequest' : 'DeleteRequest']: (
                    serialize ? serialize(rec) : serialize
                ) as unknown as RT,
            }))
            // Create request items
            const RequestItems: DynamoDB.DocumentClient.BatchWriteItemInput['RequestItems'] = {
                [tableName]: items
            }
            // Log to console 
            console.log(`Batch Write Request Items (chunk: ${index}, length: ${items}): `, JSON.stringify(RequestItems, null, 2))

            // Send batch create requests
            return docClient.batchWrite({ RequestItems }).promise()
        }) 
    )
}
export default batchWriteItems