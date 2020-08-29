import { DynamoDBStreamHandler } from "aws-lambda";

import fundPriceRecord from "lib/models/fundPriceRecord";



export const handler: DynamoDBStreamHandler = async (event, context, callback) => {
    // Create buffer of each types of aggregated records
    const buffer = {
        
    };

    // Loop through event records
    event.Records.reduce((acc, record) => {
        console.log('Stream record: ', JSON.stringify(record, null, 2));

        // Only process when it is a "INSERT" event
        if (record.eventName === 'INSERT'
            // Make sure the necessary properties are defined
            && record.dynamodb?.NewImage
            && record.dynamodb?.Keys
        ) {
            // Parse new item from record for manipulation
            const item = fundPriceRecord.parse({
                ...record.dynamodb.NewImage,
                ...record.dynamodb.Keys,            
            })
            console.log('Parsed item: ', JSON.stringify(item, null, 2));

            if (item.recordType === 'record') {
                // 1. Aggregation for latest price
                const latest = fundPriceRecord.toLatestPriceRecord(item);
                // 2. Aggregation for price change rate per week
                // 3. Aggregation for price change rate per month
                // 4. Aggregation for price change rate per quarter   
            }
        }

        return acc
    }, buffer)

    // Batch remove previous "latest" items
    
    // Batch create all aggregation items
}