import { DynamoDBStreamHandler } from "aws-lambda";

import fundPriceRecord from "lib/models/fundPriceRecord";
import getQuarter from "lib/helpers/getQuarter";
import attributeNames from "lib/models/fundPriceRecord/constants/attributeNames";



const expAttrNames = {
    COMPANY_CODE: ':company_code',
    RECORD_TYPE: ':record_type',
} as const

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

            // Only process when its `recordType` equqls `record`
            if (item.recordType === 'record') {
                // 1. Aggregation for latest price
                const latest = fundPriceRecord.toLatestPriceRecord(item);
                // Get item's date
                const itemDate = new Date(item.time)
                // Query list of items with the same code of `item`, in a quarter
                const quarterRecords = await fundPriceRecord.queryQuarterRecords({
                    ExpressionAttributeValues: {
                        [expAttrNames.COMPANY_CODE]: { S: `${item.company}_${item.code}` },
                        [expAttrNames.RECORD_TYPE]: { S: item.recordType },
                    },
                    KeyConditionExpression: `${attributeNames.COMPANY_CODE} = ${expAttrNames.COMPANY_CODE}`,
                    // We need `price` only for non-key attributes
                    ProjectionExpression: attributeNames.PRICE,
                    FilterExpression: `begins_with(${attributeNames.TIME_SK}, ${expAttrNames.RECORD_TYPE})`,
                }, {
                    year: itemDate.getFullYear(),
                    quarter: getQuarter(itemDate)
                });
                
                // // 2. Aggregation for price change rate per week
                // const weekRate = fundPriceRecord.aggregateLatestPriceChangeRate(item, 'week');
                // // 3. Aggregation for price change rate per month
                // const monthRate = fundPriceRecord.aggregateLatestPriceChangeRate(item, 'month');
                // // 4. Aggregation for price change rate per quarter   
                // const quarterRate = fundPriceRecord.aggregateLatestPriceChangeRate(item, 'quarter');

                console.log('Aggregated item: ', JSON.stringify({ item, itemDate, quarterRecords }, null, 2));

                // Assign aggregated records to buffer
            }
        }
    }

    // Batch remove previous "latest" items
    
    // Batch create all aggregation items
}