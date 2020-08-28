import { DynamoDBStreamHandler } from "aws-lambda";

import fundPriceRecord from "lib/models/fundPriceRecord";



export const handler: DynamoDBStreamHandler = async (event, context, callback) => {
    event.Records.forEach((record) => {
        console.log('Stream record: ', JSON.stringify(record, null, 2));

        if (record.eventName === 'INSERT' 
            && record.dynamodb?.NewImage
            && record.dynamodb?.Keys
        ) {
            // Parse new item from record for manipulation
            const item = fundPriceRecord.parse({
                ...record.dynamodb.NewImage,
                ...record.dynamodb.Keys,            
            })

            // 1. Aggregation for latest price
            // 2. Aggregation for price change rate per week
            // 3. Aggregation for price change rate per month
            // 4. Aggregation for price change rate per quarter
        }
    })

    // Batch remove "latest" items

    // Batch create all aggregation items
}