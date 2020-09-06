import { DynamoDBStreamHandler } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import omitBy from "lodash/omitBy";
import isEmpty from "lodash/isEmpty";
import uniq from "lodash/uniq";

import fundPriceRecord from "src/models/fundPriceRecord";
import TableRange from "src/models/fundPriceRecord/TableRange.type";
import attrs from "src/models/fundPriceRecord/constants/attributeNames";
import { FundPriceChangeRate, AggregatedRecordType, CompanyType, FundPriceRecord } from "src/models/fundPriceRecord/FundPriceRecord.type";
import getDateTimeDictionary from "src/helpers/getDateTimeDictionary";
import AWS from 'src/lib/AWS'


const docClient = new AWS.DynamoDB.DocumentClient({ convertEmptyValues: true });

const EXP_COMS = ':companies'
const EXP_FUND_TYPES = ':fundTYpes'

type PrevNextRates = [
    FundPriceChangeRate[],
    FundPriceChangeRate[]
]
type Groups = { [company in CompanyType]: FundPriceRecord[] }

export const handler: DynamoDBStreamHandler = async (event, context, callback) => {
    // Create date of latest item
    const date = new Date();
    const { year, quarter } = getDateTimeDictionary(date);

    /** -------- Process event records -------- */

    // Map and normalize items
    const records = event.Records
        // Filter inserted records and records with `NewImage` defined
        .filter(record => (
            // if it is an insert event
            record.eventName === 'INSERT'
            // and it is a "record"
            && /^record/i.test(
                AWS.DynamoDB.Converter.unmarshall(record.dynamodb?.NewImage || {})[attrs.TIME_SK] ?? ''
            )
        ))
        // @ts-expect-error
        .map(record => fundPriceRecord.parse(AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage)));

    // * Abort if there is no items to process
    if (records.length === 0) return

    // Group items by company
    const groups = records
        .reduce((_acc, record) => {
            const acc = _acc as Groups;
            const { company } = record
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
        await processCompanyRecords(company as CompanyType, items, date)
    }

    /** -------- Update table-level details  -------- */
    // Get fund types
    const fundTypes = uniq(records.map(rec => rec.fundType));
    // Update table details with companies and fund types
    await fundPriceRecord.updateTableDetails({
        // Append values to sets
        UpdateExpression: `ADD ${[
            `${attrs.COMPANIES} ${EXP_COMS}`,
            `${attrs.FUND_TYPES} ${EXP_FUND_TYPES}`
        ].join(',')}`,
        ExpressionAttributeValues: {
            [EXP_COMS]: docClient.createSet(Object.keys(groupsToProcess)),
            [EXP_FUND_TYPES]: docClient.createSet(fundTypes),
        },
    }, year, quarter);
}


/**
 * Handler to process each group of FundPriceRecord list
 */
const processCompanyRecords = async (
    company: CompanyType, 
    insertedItems: FundPriceRecord[],
    date: Date,
) => {
    // Get year and quarter
    const { year, quarter } = getDateTimeDictionary(date);
    // Create table range
    const tableRange: TableRange = { year, quarter };

    /** -------- Fetch previous recrods for price change rate of week, month and quarter -------- */

    /** Query previous latest records */
    const prevLatestRecords = await fundPriceRecord.queryLatestItemsByCompany(company, tableRange);
    const prevLatestItems = (prevLatestRecords.Items || []).map(rec => fundPriceRecord.parse(rec))

    // Aggregation for latest price
    const latestItems = insertedItems.map(item => {
        const prevItem = prevLatestItems.find(eachItem => eachItem.code === item.code)
        return fundPriceRecord.toLatestPriceRecord(item, date, prevItem)
    });

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
                const latestItem = latestItems.find(item => item.code === prevChangeRate.code)
                const nextChangeRate =  fundPriceRecord.getChangeRate(prevChangeRate, type, latestItem?.price ?? 0, prevChangeRate.priceList ?? [], 'prepend', date)
                
                return [
                    [...acc[0], prevChangeRate],
                    [...acc[1], nextChangeRate]
                ]
            }, [[], []]) as PrevNextRates
            : [
                [],
                latestItems.map(item => fundPriceRecord.getChangeRate(item, type, item.price, [], 'prepend', date))
            ]
    );

    // Derive records to save
    const [prevWeekRateItems, weekRateItems] = calculateNextChangeRates(prevWeekRateRecords.Items, 'week');
    const [prevMonthRateItems, monthRateItems] = calculateNextChangeRates(prevMonthRateRecords.Items, 'month');
    const [prevQuarterRateItems, quarterRateItems] = calculateNextChangeRates(prevQuarterRateRecords.Items, 'quarter');
    
    console.log('LATEST ITEMS TO INSERT ', JSON.stringify(latestItems.map(i => `${i.code}_${i.recordType}_${i.time}`).sort(), null, 2))
    console.log('WEEK ITEMS TO INSERT ', JSON.stringify(weekRateItems.map(i => `${i.code}_${i.recordType}_${i.time}`).sort(), null, 2))
    console.log('MONTH ITEMS TO INSERT ', JSON.stringify(monthRateItems.map(i => `${i.code}_${i.recordType}_${i.time}`).sort(), null, 2))
    console.log('QUARTER ITEMS TO INSERT ', JSON.stringify(quarterRateItems.map(i => `${i.code}_${i.recordType}_${i.time}`).sort(), null, 2))

    console.log('LATEST ITEMS TO DELETE ', JSON.stringify(prevLatestItems.map(i => `${i.code}_${i.recordType}_${i.time}`).sort(), null, 2))
    console.log('WEEK ITEMS TO DELETE ', JSON.stringify(prevWeekRateItems.map(i => `${i.code}_${i.recordType}_${i.time}`).sort(), null, 2))
    console.log('MONTH ITEMS TO DELETE ', JSON.stringify(prevMonthRateItems.map(i => `${i.code}_${i.recordType}_${i.time}`).sort(), null, 2))
    console.log('QUARTER ITEMS TO DELETE ', JSON.stringify(prevQuarterRateItems.map(i => `${i.code}_${i.recordType}_${i.time}`).sort(), null, 2))

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