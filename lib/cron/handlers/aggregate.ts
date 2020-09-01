import { DynamoDBStreamHandler } from "aws-lambda";
import zeroPadding from 'simply-utils/dist/number/zeroPadding'
import getWeekOfYear from 'simply-utils/dist/dateTime/getWeekOfYear'
import { DocumentClient } from "aws-sdk/clients/dynamodb";

import fundPriceRecord from "lib/models/fundPriceRecord";
import getQuarter from "lib/helpers/getQuarter";
import TableRange from "lib/models/fundPriceRecord/TableRange.type";
import indexNames from "lib/models/fundPriceRecord/constants/indexNames";
import attrs from "lib/models/fundPriceRecord/constants/attributeNames";
import { FundPriceChangeRate, AggregatedRecordType } from "lib/models/fundPriceRecord/FundPriceRecord.type";



const EXP_SK = `:timeSK` as string

export const handler: DynamoDBStreamHandler = async (event, context, callback) => {
    // Create date of latest item
    const date = new Date();
    // Get year
    const year = date.getFullYear();
    // Get month
    const month = zeroPadding(date.getMonth() + 1, 2);
    // Get week
    const week = getWeekOfYear(date);
    // Get quarter
    const quarter = getQuarter(date);
    // Create table range
    const tableRange: TableRange = { year, quarter };

    // Map event recrods to parsed items
    const items = event.Records
        // Filter inserted records and records with `NewImage` defined
        .filter(record => record.eventName === 'INSERT' && record.dynamodb?.NewImage)
        // @ts-expect-error
        .map(record => fundPriceRecord.parse(record.dynamodb.NewImage));

    // ggregation for latest price
    const latestItems = items.map(item => fundPriceRecord.toLatestPriceRecord(item, date));

    /** -------- Fetch previous recrods for price change rate of week, month and quarter -------- */

    /** Helper to query PERIOD_PRICE_CHANGE_RATE index */
    const queryTimePriceChangeRateIndex = (
        recordType: AggregatedRecordType, 
        period: string
    ) => fundPriceRecord.queryAllItems({
        IndexName: indexNames.PERIOD_PRICE_CHANGE_RATE,
        ExpressionAttributeValues: {
            [EXP_SK]: `${recordType}_${period}`
        },
        KeyConditionExpression: `${attrs.TIME_SK} = ${EXP_SK}`
    }, tableRange)

    // Query week price change rate
    const [
        prevWeekRateRecords, 
        prevMonthRateRecords, 
        prevQuarterRateRecords
    ] = await Promise.all([
        // Week query
        queryTimePriceChangeRateIndex(`week`, `${year}.${week}`),
        // Month query
        queryTimePriceChangeRateIndex(`month`, `${year}-${month}`),
        // Quarter query
        queryTimePriceChangeRateIndex(`quarter`,`${year}.${quarter}`),
    ]);

    /** -------- Calculate records of price change rate of week, month and quarter -------- */

    /** Helper to get latest records */
    const calculateNextChangeRates = (items: DocumentClient.QueryOutput['Items'], type: AggregatedRecordType) => (
        (items ?? []).length > 0 
            ? (items ?? []).map(item => {
                const prevChangeRate = fundPriceRecord.parseChangeRate(item);
                return fundPriceRecord.getChangeRate(prevChangeRate, type, prevChangeRate.priceList ?? [], 'prepend', date)
            })
            : latestItems.map(item => fundPriceRecord.getChangeRate(item, type, [], 'prepend', date))
    );

    // Derive records to save
    const weekRateItems: FundPriceChangeRate[] = calculateNextChangeRates(prevWeekRateRecords.Items, 'week');
    const monthRateItems: FundPriceChangeRate[] = calculateNextChangeRates(prevMonthRateRecords.Items, 'month');
    const quarterRateItems: FundPriceChangeRate[] = calculateNextChangeRates(prevQuarterRateRecords.Items, 'quarter');
    
    /** -------- Send batch requests  -------- */

    // Batch create all aggregation items
    

    // Batch remove previous items
}