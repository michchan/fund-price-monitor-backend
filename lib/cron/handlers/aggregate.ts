import { DynamoDBStreamHandler } from "aws-lambda";
import zeroPadding from 'simply-utils/dist/number/zeroPadding'
import getWeekOfYear from 'simply-utils/dist/dateTime/getWeekOfYear'

import fundPriceRecord from "lib/models/fundPriceRecord";
import getQuarter from "lib/helpers/getQuarter";
import TableRange from "lib/models/fundPriceRecord/TableRange.type";
import indexNames from "lib/models/fundPriceRecord/constants/indexNames";
import attrs from "lib/models/fundPriceRecord/constants/attributeNames";



const EXP_SK = `:sk` as string

export const handler: DynamoDBStreamHandler = async (event, context, callback) => {
    // Create date of latest item
    const latestDate = new Date();
    // Get year
    const year = latestDate.getFullYear();
    // Get month
    const month = zeroPadding(latestDate.getMonth() + 1, 2);
    // Get week
    const week = getWeekOfYear(latestDate);
    // Get quarter
    const quarter = getQuarter(latestDate);
    // Create table range
    const tableRange: TableRange = { year, quarter };

    // Map event recrods to parsed items
    const items = event.Records
        // Filter inserted records and records with `NewImage` defined
        .filter(record => record.eventName === 'INSERT' && record.dynamodb?.NewImage)
        // @ts-expect-error
        .map(record => fundPriceRecord.parse(record.dynamodb.NewImage));

    // 1. Aggregation for latest price
    const latestItems = items.map(item => fundPriceRecord.toLatestPriceRecord(item, latestDate));

    /** -------- Fetch previous recrods for price change rate of week, month and quarter -------- */

    // Query week price change rate
    const [weekRateRecords, monthRateRecords, quarterRateRecords] = await Promise.all([
        // Week query
        fundPriceRecord.queryAllItems({
            IndexName: indexNames.WEEK_PRICE_CHANGE_RATE,
            ExpressionAttributeValues: {
                [EXP_SK]: `week_${year}_${week}`
            },
            KeyConditionExpression: `${attrs.WEEK} = ${EXP_SK}`
        }, tableRange),
        // Month query
        fundPriceRecord.queryAllItems({
            IndexName: indexNames.MONTH_PRICE_CHANGE_RATE,
            ExpressionAttributeValues: {
                [EXP_SK]: `month_${year}-${month}`
            },
            KeyConditionExpression: `${attrs.MONTH} = ${EXP_SK}`
        }, tableRange),
        // Quarter query
        fundPriceRecord.queryAllItems({
            IndexName: indexNames.QUARTER_PRICE_CHANGE_RATE,
            ExpressionAttributeValues: {
                [EXP_SK]: `quarter_${year}_${quarter}`
            },
            KeyConditionExpression: `${attrs.QUARTER} = ${EXP_SK}`
        }, tableRange),
    ]);

    console.log(`TEST: `, JSON.stringify({
        latestItems,
        weekRateRecords,
        monthRateRecords,
        quarterRateRecords,
        year, month, week, quarter,
    }, null, 2));

    // // Loop through event records
    // for (const record of event.Records) {        
    //     // Only process when it is a "INSERT" event
    //     if (
    //         record.eventName === 'INSERT'
    //         // Make sure the necessary properties are defined
    //         && record.dynamodb?.NewImage
    //     ) {
    //         // Parse new item from record for manipulation
    //         const item = fundPriceRecord.parse(record.dynamodb.NewImage)
    //         // Only process when its `recordType` equals `record`
    //         if (item.recordType === 'record') {
    //             // Get item's date
    //             const itemDate = new Date(item.time);
    //             // Create queryInput for querying list of items with the same code of `item`, in a quarter
    //             const queryInput: Omit<DynamoDB.DocumentClient.QueryInput, 'TableName'> = {
    //                 ExpressionAttributeValues: {
    //                     [EXP_CC]: `${item.company}_${item.code}`,
    //                     [EXP_RT]: item.recordType,
    //                 },
    //                 KeyConditionExpression: `${attrs.COMPANY_CODE} = ${EXP_CC} AND ${
    //                     db.expressionFunctions.beginsWith(attrs.TIME_SK, EXP_RT)
    //                 }`,
    //                 // To calculate the following aggregated items, we only need `timeSK` and `price`.
    //                 ProjectionExpression: [
    //                     attrs.TIME_SK,
    //                     attrs.PRICE,
    //                 ].join(','),
    //             }
    //             // Send query with year and quarter of `item`
    //             const quarterRecords = await fundPriceRecord.scanQuarterRecords(queryInput, {
    //                 year: itemDate.getFullYear(),
    //                 quarter: getQuarter(itemDate)
    //             });
                
    //             // 1. Aggregation for latest price
    //             const latest = fundPriceRecord.toLatestPriceRecord(item);
    //             // // 2. Aggregation for price change rate per week
    //             // const weekRate = fundPriceRecord.aggregateLatestPriceChangeRate(item, 'week');
    //             // // 3. Aggregation for price change rate per month
    //             // const monthRate = fundPriceRecord.aggregateLatestPriceChangeRate(item, 'month');
    //             // // 4. Aggregation for price change rate per quarter   
    //             // const quarterRate = fundPriceRecord.aggregateLatestPriceChangeRate(item, 'quarter');

    //             console.log('Aggregation Results: ', JSON.stringify({ item, itemDate, queryInput, quarterRecords, latest }, null, 2));

    //             // Assign aggregated records to buffer  
    //         } 
    //     }
    // }

    // Batch remove previous "latest" items
    
    // Batch create all aggregation items
}