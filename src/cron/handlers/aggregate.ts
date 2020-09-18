import { DynamoDBStreamHandler } from "aws-lambda";
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

    /**
     * ! IMPORTANT: All the records retrieved process must be filtered by `insertedItems`
     */
    const matchInserted = (rec: FundPriceRecord | FundPriceChangeRate) => insertedItems.some(inserted => inserted.code === rec.code)

    /** -------- Fetch previous recrods for price change rate of week, month and quarter -------- */

    /** Query previous latest records */
    const prevLatestRecords = await fundPriceRecord.queryItemsByCompany(company, true, true, tableRange);
    const prevLatestItems = (prevLatestRecords.Items || [])
        // Parse records
        .map(rec => fundPriceRecord.parse(rec))
        // Filters by insertedItems
        .filter(matchInserted)

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
        fundPriceRecord.queryPeriodPriceChangeRate(company, `week`, fundPriceRecord.getPeriodByRecordType('week', date), true),
        // Month query
        fundPriceRecord.queryPeriodPriceChangeRate(company, `month`, fundPriceRecord.getPeriodByRecordType('month', date), true),
        // Quarter query
        fundPriceRecord.queryPeriodPriceChangeRate(company, `quarter`, fundPriceRecord.getPeriodByRecordType('quarter', date), true),
    ]);

    // Parse previous records
    const prevWeekRateItems = (prevWeekRateRecords.Items ?? []).map(rec => fundPriceRecord.parseChangeRate(rec)).filter(matchInserted)
    const prevMonthRateItems = (prevMonthRateRecords.Items ?? []).map(rec => fundPriceRecord.parseChangeRate(rec)).filter(matchInserted)
    const prevQuarterRateItems = (prevQuarterRateRecords.Items ?? []).map(rec => fundPriceRecord.parseChangeRate(rec)).filter(matchInserted)

    /** -------- Calculate records of price change rate of week, month and quarter -------- */

    /**
     * Derive next change rate records
     */
    const deriveChangeRateRecords = (
        type: AggregatedRecordType,
        prevItems: FundPriceChangeRate[],
    ) => latestItems.map(item => {
        const prevChangeRate = prevItems.find(chRate => chRate.code === item.code)
        const nextChangeRate = fundPriceRecord.getChangeRate(
            prevChangeRate ?? item, 
            type, 
            item.price, 
            prevChangeRate?.priceList ?? [],
            'prepend',
            date
        );
        return nextChangeRate
    });

    // Derive records to save
    const weekRateItems = deriveChangeRateRecords('week', prevWeekRateItems);
    const monthRateItems = deriveChangeRateRecords('month', prevMonthRateItems);
    const quarterRateItems = deriveChangeRateRecords('quarter', prevQuarterRateItems);

    /** -------- Send batch requests  -------- */

    // Log records to insert
    console.log(`latestItems to insert (${latestItems.length}): `, JSON.stringify(latestItems, null, 2));

    // Batch create all aggregation items
    // Create latest records
    await fundPriceRecord.batchCreateItems(latestItems, year, quarter, fundPriceRecord.serialize);

    // Log records to insert
    console.log(`weekRateItems to insert (${weekRateItems.length}): `, JSON.stringify(weekRateItems, null, 2));
    console.log(`monthRateItems to insert (${weekRateItems.length}): `, JSON.stringify(monthRateItems, null, 2));
    console.log(`quarterRateItems to insert (${weekRateItems.length}): `, JSON.stringify(quarterRateItems, null, 2));

    // Create change rates
    await fundPriceRecord.batchCreateItems([
        ...weekRateItems, 
        ...monthRateItems, 
        ...quarterRateItems
    ], year, quarter, fundPriceRecord.serializeChangeRate);

    // Log records to remove
    console.log(`prevLatestItems to remove (${prevLatestItems.length}): `, JSON.stringify(prevLatestItems, null, 2));

    // Batch remove previous items
    // Remove previous latest records
    await fundPriceRecord.batchDeleteItems(prevLatestItems, year, quarter, fundPriceRecord.getCompositeSK);

    // Log records to insert
    console.log(`prevWeekRateItems to remove (${prevWeekRateItems.length}): `, JSON.stringify(prevWeekRateItems, null, 2));
    console.log(`prevMonthRateItems to remove (${prevMonthRateItems.length}): `, JSON.stringify(prevMonthRateItems, null, 2));
    console.log(`prevQuarterRateItems to remove (${prevQuarterRateItems.length}): `, JSON.stringify(prevQuarterRateItems, null, 2));

    // Remove previous change rates
    await fundPriceRecord.batchDeleteItems([
        ...prevWeekRateItems, 
        ...prevMonthRateItems, 
        ...prevQuarterRateItems
    ], year, quarter, fundPriceRecord.getCompositeSKFromChangeRate);
}