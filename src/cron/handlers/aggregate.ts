import { DynamoDBStreamHandler } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import omitBy from "lodash/omitBy";
import isEmpty from "lodash/isEmpty";

import fundPriceRecord from "src/models/fundPriceRecord";
import TableRange from "src/models/fundPriceRecord/TableRange.type";
import attrs from "src/models/fundPriceRecord/constants/attributeNames";
import { FundPriceChangeRate, AggregatedRecordType, CompanyType, FundPriceRecord } from "src/models/fundPriceRecord/FundPriceRecord.type";
import db from "src/lib/AWS/dynamodb";
import getDateTimeDictionary from "src/helpers/getDateTimeDictionary";


type PrevNextRates = [
    FundPriceChangeRate[],
    FundPriceChangeRate[]
]
type Groups = { [company in CompanyType]: FundPriceRecord[] }

export const handler: DynamoDBStreamHandler = async (event, context, callback) => {
    /** -------- Process event records -------- */

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
    const groupsToProcess = omitBy(groups, isEmpty);

    /** -------- Process reords by company  -------- */

    // Process each group
    for (const [company, items] of Object.entries(groupsToProcess)) {
        await processCompanyRecords(company as CompanyType, items)
    }
}


/**
 * Handler to process each group of FundPriceRecord list
 */
const processCompanyRecords = async (
    company: CompanyType, 
    insertedItems: FundPriceRecord[],
) => {
    // Create date of latest item
    const date = new Date();
    const { week, month, year, quarter } = getDateTimeDictionary(date);
    // Create table range
    const tableRange: TableRange = { year, quarter };

    // ggregation for latest price
    const latestItems = insertedItems.map(item => fundPriceRecord.toLatestPriceRecord(item, date));

    /** -------- Fetch previous recrods for price change rate of week, month and quarter -------- */

    /** Query previous latest records */
    const prevLatestRecords = await fundPriceRecord.queryLatestItemsByCompany(company, tableRange);
    const prevLatestItems = (prevLatestRecords.Items || []).map(rec => fundPriceRecord.parse(rec))

    // Query week price change rate
    const [
        prevWeekRateRecords, 
        prevMonthRateRecords, 
        prevQuarterRateRecords
    ] = await Promise.all([
        // Week query
        fundPriceRecord.queryPeriodPriceChangeRate(company, `week`, fundPriceRecord.getPeriodByRecordType('week', date)),
        // Month query
        fundPriceRecord.queryPeriodPriceChangeRate(company, `month`, fundPriceRecord.getPeriodByRecordType('month', date)),
        // Quarter query
        fundPriceRecord.queryPeriodPriceChangeRate(company, `quarter`, fundPriceRecord.getPeriodByRecordType('quarter', date)),
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
}