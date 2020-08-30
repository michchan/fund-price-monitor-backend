import { DynamoDB } from 'aws-sdk';
import chunk from 'lodash/chunk'

import AWS from 'lib/AWS/AWS'


// Initialize
const docClient = new AWS.DynamoDB.DocumentClient();

export type ChunkResult = DynamoDB.DocumentClient.BatchWriteItemOutput
export type Result = ChunkResult[]

/**
 * Return a list of properties of tables that have been created and match the criteria
 */
function batchCreateItems <T> (
    records: T[],
    tableName: string,
    serialize?: (item: T) => DynamoDB.DocumentClient.PutRequest,
): Promise<Result> {
    // Chunk records by 25 which is the max number of items DynamoDB can batch write.
    const chunks = chunk(records, 25)
    // Send batch requests for each chunk
    return Promise.all(
        chunks.map((chunkedRecords, index): Promise<ChunkResult> => {
            // Send batch create requests
            return docClient.batchWrite({
                RequestItems: {
                    [tableName]: chunkedRecords.map(rec => ({
                        PutRequest: (serialize ? serialize(rec) : serialize) as unknown as DynamoDB.DocumentClient.PutRequest
                    }))
                }
            }).promise()
        }) 
    )
}
export default batchCreateItems