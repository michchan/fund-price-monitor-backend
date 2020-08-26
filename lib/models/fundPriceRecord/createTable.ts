import { DynamoDB } from 'aws-sdk';
import { NonKeyAttributeNameList } from 'aws-sdk/clients/dynamodb';

import AWS from 'lib/AWS'
import getTableName from './getTableName';
import { Quarter } from 'lib/helpers/getCurrentQuarter';
import attributeNames from './attributeNames';
import indexNames from './indexNames';


// Initialize
const dynamodb = new AWS.DynamoDB();

/** Common throughput for GSI */
const GSI_COMMON_THROUGHPUT: DynamoDB.GlobalSecondaryIndex['ProvisionedThroughput'] = {
    ReadCapacityUnits: 1,
    WriteCapacityUnits: 1,
}

/** Helper to create common GSI */
const createKeysOnlyCSI = (
    config: Pick<DynamoDB.GlobalSecondaryIndex, 'IndexName' | 'KeySchema'>
): DynamoDB.GlobalSecondaryIndex => ({
    Projection: {
        ProjectionType: 'KEYS_ONLY'
    },
    ProvisionedThroughput: GSI_COMMON_THROUGHPUT,
    ...config
})

/** Helper to create common GSI */
const createInclusiveCSI = (
    config: Pick<DynamoDB.GlobalSecondaryIndex, 'IndexName' | 'KeySchema'>,
    NonKeyAttributes: NonKeyAttributeNameList,
): DynamoDB.GlobalSecondaryIndex => ({
    Projection: {
        ProjectionType: 'INCLUDE',
        NonKeyAttributes: NonKeyAttributes
    },
    ProvisionedThroughput: GSI_COMMON_THROUGHPUT,
    ...config
})

/** Helper to get table params */
const getTableParams = (tableName: string): DynamoDB.CreateTableInput => ({
    TableName: tableName,
    KeySchema: [
        { AttributeName: attributeNames.COMPANY_CODE, KeyType: 'HASH' },
        { AttributeName: attributeNames.TIME_SK, KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
        { AttributeName: attributeNames.COMPANY_CODE, AttributeType: 'S' },
        { AttributeName: attributeNames.TIME_SK, AttributeType: 'S' },
        { AttributeName: attributeNames.COMPANY, AttributeType: 'S' },
        { AttributeName: attributeNames.RISK_LEVEL, AttributeType: 'S' },
        { AttributeName: attributeNames.WEEK, AttributeType: 'S' },
        { AttributeName: attributeNames.MONTH, AttributeType: 'S' },
        { AttributeName: attributeNames.QUARTER, AttributeType: 'S' },
        { AttributeName: attributeNames.PRICE_CHANGE_RATE, AttributeType: 'N' },
    ],
    // Every created table are regarded as a table containing the latest time series data,
    // So assign the best capacity units.
    ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 1,
    },
    GlobalSecondaryIndexes: [
        createKeysOnlyCSI({
            IndexName: indexNames.WEEK_PRICE_CHANGE_RATE,
            KeySchema: [
                { AttributeName: attributeNames.WEEK, KeyType: 'HASH' },
                { AttributeName: attributeNames.PRICE_CHANGE_RATE, KeyType: 'RANGE' },
            ],
        }),
        createKeysOnlyCSI({
            IndexName: indexNames.MONTH_PRICE_CHANGE_RATE,
            KeySchema: [
                { AttributeName: attributeNames.MONTH, KeyType: 'HASH' },
                { AttributeName: attributeNames.PRICE_CHANGE_RATE, KeyType: 'RANGE' },
            ],
        }),
        createKeysOnlyCSI({
            IndexName: indexNames.QUARTER_PRICE_CHANGE_RATE,
            KeySchema: [
                { AttributeName: attributeNames.QUARTER, KeyType: 'HASH' },
                { AttributeName: attributeNames.PRICE_CHANGE_RATE, KeyType: 'RANGE' },
            ],
        }),
        createInclusiveCSI({
            IndexName: indexNames.RECORDS_BY_COMPANY,
            KeySchema: [
                { AttributeName: attributeNames.COMPANY, KeyType: 'HASH' },
            ],
        }, [attributeNames.PRICE, attributeNames.NAME, attributeNames.UPDATED_DATE]),
        createInclusiveCSI({
            IndexName: indexNames.RECORDS_BY_RISK_LEVEL,
            KeySchema: [
                { AttributeName: attributeNames.RISK_LEVEL, KeyType: 'HASH' },
            ],
        }, [attributeNames.PRICE, attributeNames.NAME, attributeNames.UPDATED_DATE]),
    ]
})

export interface Result extends DynamoDB.CreateTableOutput {};

const createTable = (
    /** In YYYY format */
    year: string | number,
    quarter: Quarter,
): Promise<Result> => {
    // Get based table name
    const tableName = getTableName(year, quarter)
    // Send create table request
    return dynamodb.createTable(getTableParams(tableName)).promise()
}
export default createTable