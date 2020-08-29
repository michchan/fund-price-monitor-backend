import { DynamoDBStreamHandler } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

import fundPriceRecord from "lib/models/fundPriceRecord";
import getQuarter from "lib/helpers/getQuarter";
import attrs from "lib/models/fundPriceRecord/constants/attributeNames";
import db from "lib/db";



const EXP_CC = `:company_code`
const EXP_RT = `:recordType`

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
                // Get item's date
                const itemDate = new Date(item.time);
                // Create params for querying list of items with the same code of `item`, in a quarter
                const params: Omit<DynamoDB.QueryInput, 'TableName'> = {
                    ExpressionAttributeValues: {
                        [EXP_CC]: { S: `${item.company}_${item.code}` },
                        [EXP_RT]: { S: item.recordType },
                    },
                    KeyConditionExpression: `${attrs.COMPANY_CODE} = ${EXP_CC}`,
                    // We need `price` only for non-key attributes
                    ProjectionExpression: attrs.PRICE,
                    FilterExpression: db.expressionFunctions.beginsWith(attrs.TIME_SK, EXP_RT),
                }
                console.log('Params: ', JSON.stringify({ item, itemDate, params }, null, 2));
                // Send query with year and quarter of `item`
                const quarterRecords = await fundPriceRecord.queryQuarterRecords(params, {
                    year: itemDate.getFullYear(),
                    quarter: getQuarter(itemDate)
                });
                
                // 1. Aggregation for latest price
                const latest = fundPriceRecord.toLatestPriceRecord(item);
                // // 2. Aggregation for price change rate per week
                // const weekRate = fundPriceRecord.aggregateLatestPriceChangeRate(item, 'week');
                // // 3. Aggregation for price change rate per month
                // const monthRate = fundPriceRecord.aggregateLatestPriceChangeRate(item, 'month');
                // // 4. Aggregation for price change rate per quarter   
                // const quarterRate = fundPriceRecord.aggregateLatestPriceChangeRate(item, 'quarter');

                console.log('Aggregated item: ', JSON.stringify({ item, itemDate, params, quarterRecords, latest }, null, 2));

                // Assign aggregated records to buffer
            }
        }
    }

    // Batch remove previous "latest" items
    
    // Batch create all aggregation items
}