import { DynamoDB } from 'aws-sdk';
import chunk from 'lodash/chunk'

import AWS from 'lib/AWS'
import { FundPriceRecord } from './FundPriceRecord.type';
import serialize from './serialize';


// Initialize
const docClient = new AWS.DynamoDB.DocumentClient();

export type ChunkResult = DynamoDB.BatchWriteItemOutput
export type Result = ChunkResult[]

/**
 * Return a list of properties of tables that have been created and match the criteria
 */
const batchCreateItems = (
    records: FundPriceRecord[],
    tableName: string,
): Promise<Result> => {
    // Chunk records by 25 which is the max number of items DynamoDB can batch write.
    const chunks = chunk(records, 25)
    // Send batch requests for each chunk
    return Promise.all(
        chunks.map((chunkedRecords, index): Promise<ChunkResult> => new Promise((resolve, reject) => {
            // Send batch create requests
            docClient.batchWrite({
                RequestItems: {
                    [tableName]: chunkedRecords.map(rec => ({
                        PutRequest: serialize(rec)
                    }))
                }
            }, (err, data) => {
                if (err) {
                    reject(new Error(`Unable to batch create items (index: ${index}). Error JSON: ${err}`));
                } else {
                    resolve(data);
                }
            })
        })) 
    )
}
export default batchCreateItems