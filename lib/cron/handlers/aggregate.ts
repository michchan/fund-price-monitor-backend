import { DynamoDBStreamHandler } from "aws-lambda";



export const handler: DynamoDBStreamHandler = async (event, context, callback) => {
    event.Records.forEach((record) => {
        console.log('Stream record: ', JSON.stringify(record, null, 2));

        if (record.eventName === 'INSERT') {
            // 1. Aggregation for latest price
            // 2. Aggregation for price change rate per week
            // 3. Aggregation for price change rate per month
            // 4. Aggregation for price change rate per quarter
        }
    })

    // Batch remove "latest" items

    // Batch create all aggregation items
}