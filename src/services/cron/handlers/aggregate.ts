import { DynamoDBStreamHandler } from "aws-lambda"
import omitBy from "lodash/omitBy"
import isEmpty from "lodash/isEmpty"
import uniq from "lodash/uniq"

import TableRange from "src/models/fundPriceRecord/TableRange.type"
import attrs from "src/models/fundPriceRecord/constants/attributeNames"
import { FundPriceChangeRate, AggregatedRecordType, CompanyType, FundPriceRecord } from "src/models/fundPriceRecord/FundPriceRecord.type"
import getDateTimeDictionary from "src/helpers/getDateTimeDictionary"
import AWS from 'src/lib/AWS'
import batchDeleteItems from "src/models/fundPriceRecord/io/batchDeleteItems"
import batchCreateItems from "src/models/fundPriceRecord/io/batchCreateItems"
import serializeChangeRate from "src/models/fundPriceRecord/utils/serializeChangeRate"
import getCompositeSKFromChangeRate from "src/models/fundPriceRecord/utils/getCompositeSKFromChangeRate"
import getCompositeSK from "src/models/fundPriceRecord/utils/getCompositeSK"
import updateTableDetails from "src/models/fundPriceRecord/io/updateTableDetails"
import queryItemsByCompany from "src/models/fundPriceRecord/io/queryItemsByCompany"
import toLatestPriceRecord from "src/models/fundPriceRecord/utils/toLatestPriceRecord"
import parse from "src/models/fundPriceRecord/utils/parse"
import getPeriodByRecordType from "src/models/fundPriceRecord/utils/getPeriodByRecordType"
import queryPeriodPriceChangeRate from "src/models/fundPriceRecord/io/queryPeriodPriceChangeRate"
import parseChangeRate from "src/models/fundPriceRecord/utils/parseChangeRate"
import getChangeRate from "src/models/fundPriceRecord/utils/getChangeRate"
import serialize from "src/models/fundPriceRecord/utils/serialize"


const docClient = new AWS.DynamoDB.DocumentClient({ convertEmptyValues: true })

const EXP_COMS = ':companies'
const EXP_FUND_TYPES = ':fundTYpes'

type Groups = { [company in CompanyType]: FundPriceRecord[] }

export const handler: DynamoDBStreamHandler = async (event, context, callback) => {
    // Create date of latest item
    const date = new Date()
    const { year, quarter } = getDateTimeDictionary(date)

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
        .map(record => parse(AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage)))

    // * Abort if there is no items to process
    if (records.length === 0) return

    // Group items by company
    const groups = records
        .reduce((_acc, record) => {
            const acc = _acc as Groups
            const { company } = record
            return {
                ...acc,
                [company]: [
                    ...(acc[company] ?? []),
                    record
                ]
            }
        }, {}) as Groups

    // Filter empty groups
    const groupsToProcess = omitBy(groups, isEmpty)

    /** -------- Process reords by company  -------- */
    // Process each group
    for (const [company, items] of Object.entries(groupsToProcess)) {
        await processCompanyRecords(company as CompanyType, items, date)
    }

    /** -------- Update table-level details  -------- */
    // Get fund types
    const fundTypes = uniq(records.map(rec => rec.fundType))
    // Update table details with companies and fund types
    await updateTableDetails({
        // Append values to sets
        UpdateExpression: `ADD ${[
            `${attrs.COMPANIES} ${EXP_COMS}`,
            `${attrs.FUND_TYPES} ${EXP_FUND_TYPES}`
        ].join(',')}`,
        ExpressionAttributeValues: {
            [EXP_COMS]: docClient.createSet(Object.keys(groupsToProcess)),
            [EXP_FUND_TYPES]: docClient.createSet(fundTypes),
        },
    }, year, quarter)
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
    const { year, quarter } = getDateTimeDictionary(date)
    // Create table range
    const tableRange: TableRange = { year, quarter }

    /**
     * ! IMPORTANT: All the records retrieved process must be filtered by `insertedItems`
     */
    const matchInserted = (rec: FundPriceRecord | FundPriceChangeRate) => insertedItems.some(inserted => inserted.code === rec.code)

    /** -------- Fetch previous recrods for price change rate of week, month and quarter -------- */

    /** Query previous latest records */
    const prevLatestRecords = await queryItemsByCompany(company, true, true, tableRange)
    const prevLatestItems = (prevLatestRecords.Items || [])
        // Parse records
        .map(rec => parse(rec))
        // Filters by insertedItems
        .filter(matchInserted)

    // Aggregation for latest price
    const latestItems = insertedItems.map(item => {
        const prevItem = prevLatestItems.find(eachItem => eachItem.code === item.code)
        return toLatestPriceRecord(item, date, prevItem)
    })

    // Query week price change rate
    const [
        prevWeekRateRecords, 
        prevMonthRateRecords, 
        prevQuarterRateRecords
    ] = await Promise.all([
        // Week query
        queryPeriodPriceChangeRate(company, `week`, getPeriodByRecordType('week', date), true),
        // Month query
        queryPeriodPriceChangeRate(company, `month`, getPeriodByRecordType('month', date), true),
        // Quarter query
        queryPeriodPriceChangeRate(company, `quarter`, getPeriodByRecordType('quarter', date), true),
    ])

    // Parse previous records
    const prevWeekRateItems = (prevWeekRateRecords.Items ?? []).map(rec => parseChangeRate(rec)).filter(matchInserted)
    const prevMonthRateItems = (prevMonthRateRecords.Items ?? []).map(rec => parseChangeRate(rec)).filter(matchInserted)
    const prevQuarterRateItems = (prevQuarterRateRecords.Items ?? []).map(rec => parseChangeRate(rec)).filter(matchInserted)

    /** -------- Calculate records of price change rate of week, month and quarter -------- */

    /**
     * Derive next change rate records
     */
    const deriveChangeRateRecords = (
        type: AggregatedRecordType,
        prevItems: FundPriceChangeRate[],
    ) => latestItems.map(item => {
        const prevChangeRate = prevItems.find(chRate => chRate.code === item.code)
        const nextChangeRate = getChangeRate(
            prevChangeRate ?? item, 
            type, 
            item.price, 
            prevChangeRate?.priceList ?? [],
            'prepend',
            date
        )
        return nextChangeRate
    })

    // Derive records to save
    const weekRateItems = deriveChangeRateRecords('week', prevWeekRateItems)
    const monthRateItems = deriveChangeRateRecords('month', prevMonthRateItems)
    const quarterRateItems = deriveChangeRateRecords('quarter', prevQuarterRateItems)

    /** -------- Send batch requests  -------- */

    // Log records to insert
    console.log(`latestItems to insert (${latestItems.length}): `, JSON.stringify(latestItems, null, 2))

    // Batch create all aggregation items
    // Create latest records
    await batchCreateItems(latestItems, year, quarter, serialize)

    // Log records to insert
    console.log(`weekRateItems to insert (${weekRateItems.length}): `, JSON.stringify(weekRateItems, null, 2))
    console.log(`monthRateItems to insert (${weekRateItems.length}): `, JSON.stringify(monthRateItems, null, 2))
    console.log(`quarterRateItems to insert (${weekRateItems.length}): `, JSON.stringify(quarterRateItems, null, 2))

    // Create change rates
    await batchCreateItems([
        ...weekRateItems, 
        ...monthRateItems, 
        ...quarterRateItems
    ], year, quarter, serializeChangeRate)

    // Log records to remove
    console.log(`prevLatestItems to remove (${prevLatestItems.length}): `, JSON.stringify(prevLatestItems, null, 2))

    // Batch remove previous items
    // Remove previous latest records
    await batchDeleteItems(prevLatestItems, year, quarter, getCompositeSK)

    // Log records to insert
    console.log(`prevWeekRateItems to remove (${prevWeekRateItems.length}): `, JSON.stringify(prevWeekRateItems, null, 2))
    console.log(`prevMonthRateItems to remove (${prevMonthRateItems.length}): `, JSON.stringify(prevMonthRateItems, null, 2))
    console.log(`prevQuarterRateItems to remove (${prevQuarterRateItems.length}): `, JSON.stringify(prevQuarterRateItems, null, 2))

    // Remove previous change rates
    await batchDeleteItems([
        ...prevWeekRateItems, 
        ...prevMonthRateItems, 
        ...prevQuarterRateItems
    ], year, quarter, getCompositeSKFromChangeRate)
}