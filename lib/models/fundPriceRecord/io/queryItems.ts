import { DynamoDB } from 'aws-sdk';

import AWS from 'lib/AWS'
import { FundPriceRecord } from '../FundPriceRecord.type';


// Initialize
const docClient = new AWS.DynamoDB.DocumentClient();

export type Result = DynamoDB.QueryOutput

/**
 * Return a list of properties of tables that have been created and match the criteria
 */
const queryItems = (
    TableName: string,
): Promise<Result> => {
    return docClient.query({
        TableName,
        
    }).promise()
    // // Chunk records by 25 which is the max number of items DynamoDB can batch write.
    // const chunks = chunk(records, 25)
    // // Send batch requests for each chunk
    // return Promise.all(
    //     chunks.map((chunkedRecords, index): Promise<ChunkResult> => {
    //         // Send batch create requests
    //         return docClient.batchWrite({
    //             RequestItems: {
    //                 [tableName]: chunkedRecords.map(rec => ({
    //                     PutRequest: serialize(rec)
    //                 }))
    //             }
    //         }).promise()
    //     }) 
    // )
}
export default queryItems