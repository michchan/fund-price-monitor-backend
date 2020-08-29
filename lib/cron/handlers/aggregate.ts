import { DynamoDBStreamHandler } from "aws-lambda";

import fundPriceRecord from "lib/models/fundPriceRecord";



export const handler: DynamoDBStreamHandler = async (event, context, callback) => {
    // Create buffer of each types of aggregated records
    const buffer = {
        
    };

    // Loop through event records
    for (const record of event.Records) {
        console.log('Stream record: ', JSON.stringify(record, null, 2));
        
        // Only process when it is a "INSERT" event
        if (record.eventName === 'INSERT'
            // Make sure the necessary properties are defined
            && record.dynamodb?.NewImage
        ) {
            // Parse new item from record for manipulation
            const item = fundPriceRecord.parse(record.dynamodb.NewImage)
            console.log('Parsed item: ', JSON.stringify(item, null, 2));

            if (item.recordType === 'record') {
                // 1. Aggregation for latest price
                const latest = fundPriceRecord.toLatestPriceRecord(item);
                // Query list of items with the same code of `item`, in a quarter
                // const quarterRecords = 
                
                // // 2. Aggregation for price change rate per week
                // const weekRate = fundPriceRecord.aggregateLatestPriceChangeRate(item, 'week');
                // // 3. Aggregation for price change rate per month
                // const monthRate = fundPriceRecord.aggregateLatestPriceChangeRate(item, 'month');
                // // 4. Aggregation for price change rate per quarter   
                // const quarterRate = fundPriceRecord.aggregateLatestPriceChangeRate(item, 'quarter');

                // console.log('Aggregated item: ', JSON.stringify({ startTime, items, latest, weekRate, monthRate, quarterRate }, null, 2));

                // Assign aggregated records to buffer
            }
        }
    }

    // Batch remove previous "latest" items
    
    // Batch create all aggregation items
}