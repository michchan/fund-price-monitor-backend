import { DynamoDBStreamHandler } from "aws-lambda";
import zeroPadding from 'simply-utils/dist/number/zeroPadding'
import getWeekOfYear from 'simply-utils/dist/dateTime/getWeekOfYear'
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import omitBy from "lodash/omitBy";
import isEmpty from "lodash/isEmpty";
import getQuarter from "simply-utils/dist/dateTime/getQuarter";

import fundPriceRecord from "src/models/fundPriceRecord";
import TableRange from "src/models/fundPriceRecord/TableRange.type";
import indexNames from "src/models/fundPriceRecord/constants/indexNames";
import attrs from "src/models/fundPriceRecord/constants/attributeNames";
import { FundPriceChangeRate, AggregatedRecordType, CompanyType, FundPriceRecord } from "src/models/fundPriceRecord/FundPriceRecord.type";
import db from "src/lib/AWS/dynamodb";


type PrevNextRates = [
    FundPriceChangeRate[],
    FundPriceChangeRate[]
]
type Groups = { [company in CompanyType]: FundPriceRecord[] }

const EXP_COM_PK = `:company` as string
const EXP_TIME_SK = `:timeSK` as string

export const handler: DynamoDBStreamHandler = async (event, context, callback) => {
    // Group items by company
    const groups = event.Records
        // Filter inserted records and records with `NewImage` defined
        .filter(record => (
            // if it is an insert event
            record.eventName === 'INSERT'
            // and it is a "record"
            && /^record/i.test(
                db.mapRawAttributes(record.dynamodb?.NewImage || {})[attrs.TIME_SK] ?? ''
            )
        ))
        // @ts-expect-error
        .map(record => fundPriceRecord.parse(db.mapRawAttributes(record.dynamodb.NewImage)))
        .reduce((_acc, record) => {
            const acc = _acc as Groups;
            const {company } = record
            return {
                ...acc,
                [company]: [
                    ...(acc[company] ?? []),
                    record
                ]
            }
        }, {}) as Groups;
    // Filter empty groups
    const groupsToProcess = omitBy(groups, isEmpty)

    // Process each group
    for (const [company, items] of Object.entries(groupsToProcess)) {
        await processCompanyRecords(company as CompanyType, items)
    }
}


/**
 * Handler to process each group of FundPriceRecord list
 */
const processCompanyRecords = async (company: CompanyType, insertedItems: FundPriceRecord[]) => {
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

    // ggregation for latest price
    const latestItems = insertedItems.map(item => fundPriceRecord.toLatestPriceRecord(item, date));

    /** -------- Fetch previous recrods for price change rate of week, month and quarter -------- */

    /** Query previous latest records */
    const prevLatestRecords = await fundPriceRecord.queryAllItems({
        IndexName: indexNames.RECORDS_BY_COMPANY,
        ExpressionAttributeValues: {
            [EXP_COM_PK]: company,
            [EXP_TIME_SK]: 'latest'
        },
        KeyConditionExpression: `${attrs.COMPANY} = ${EXP_COM_PK}`,
        FilterExpression: db.expressionFunctions.beginsWith(attrs.TIME_SK, EXP_TIME_SK)
    }, tableRange)
    const prevLatestItems = (prevLatestRecords.Items || []).map(rec => fundPriceRecord.parse(rec))

    /** Helper to query PERIOD_PRICE_CHANGE_RATE index */
    const queryTimePriceChangeRateIndex = (
        recordType: AggregatedRecordType, 
        period: string
    ) => fundPriceRecord.queryAllItems({
        IndexName: indexNames.PERIOD_PRICE_CHANGE_RATE,
        ExpressionAttributeValues: {
            [EXP_TIME_SK]: `${recordType}_${company}_${period}`
        },
        KeyConditionExpression: `${attrs.PERIOD} = ${EXP_TIME_SK}`
    }, tableRange)

    // Query week price change rate
    const [
        prevWeekRateRecords, 
        prevMonthRateRecords, 
        prevQuarterRateRecords
    ] = await Promise.all([
        // Week query
        queryTimePriceChangeRateIndex(`week`, `${year}-${month}.${week}`),
        // Month query
        queryTimePriceChangeRateIndex(`month`, `${year}-${month}`),
        // Quarter query
        queryTimePriceChangeRateIndex(`quarter`,`${year}.${quarter}`),
    ]);

    /** -------- Calculate records of price change rate of week, month and quarter -------- */

    /** Helper to get latest records */
    const calculateNextChangeRates = (items: DocumentClient.QueryOutput['Items'], type: AggregatedRecordType): PrevNextRates => (
        (items ?? []).length > 0 
            ? (items ?? []).reduce((acc, item) => {
                const prevChangeRate = fundPriceRecord.parseChangeRate(item);
                const nextChangeRate =  fundPriceRecord.getChangeRate(prevChangeRate, type, prevChangeRate.priceList ?? [], 'prepend', date)
                
                return [
                    [...acc[0], prevChangeRate],
                    [...acc[1], nextChangeRate]
                ]
            }, [[], []]) as PrevNextRates
            : [
                [],
                latestItems.map(item => fundPriceRecord.getChangeRate(item, type, [], 'prepend', date))
            ]
    );

    // Derive records to save
    const [prevWeekRateItems, weekRateItems] = calculateNextChangeRates(prevWeekRateRecords.Items, 'week');
    const [prevMonthRateItems, monthRateItems] = calculateNextChangeRates(prevMonthRateRecords.Items, 'month');
    const [prevQuarterRateItems, quarterRateItems] = calculateNextChangeRates(prevQuarterRateRecords.Items, 'quarter');
    
    /** -------- Send batch requests  -------- */

    // Batch create all aggregation items
    // Create latest records
    await fundPriceRecord.batchCreateItems(latestItems, year, quarter, fundPriceRecord.serialize);
    // Create change rates
    await fundPriceRecord.batchCreateItems([
        ...weekRateItems, 
        ...monthRateItems, 
        ...quarterRateItems
    ], year, quarter, fundPriceRecord.serializeChangeRate);

    // Batch remove previous items
    // Remove previous latest records
    await fundPriceRecord.batchDeleteItems(prevLatestItems, year, quarter, fundPriceRecord.getCompositeSK);
    // Remove previous change rates
    await fundPriceRecord.batchDeleteItems([
        ...prevWeekRateItems, 
        ...prevMonthRateItems, 
        ...prevQuarterRateItems
    ], year, quarter, fundPriceRecord.getCompositeSKFromChangeRate);

    /** -------- Send notifications for latest records (daily)  -------- */

    
}