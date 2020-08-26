import { DynamoDB } from 'aws-sdk';

import AWS from 'lib/AWS'
import getTableName from './getTableName';
import { Quarter } from 'lib/helpers/getCurrentQuarter';
import attributeNames from './attributeNames';
import indexNames from './indexNames';


// Initialize
const dynamodb = new AWS.DynamoDB();

/** Common throughput for GSI */
const GSI_COMMON_CONFIG: Pick<DynamoDB.GlobalSecondaryIndex, 'Projection' | 'ProvisionedThroughput'> = {
    Projection: {
        ProjectionType: 'KEYS_ONLY'
    },
    ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1,
    }
}

/** Helper to create common GSI */
const createCommonGSI = (
    config: Pick<DynamoDB.GlobalSecondaryIndex, 'IndexName' | 'KeySchema'>
): DynamoDB.GlobalSecondaryIndex => ({
    ...GSI_COMMON_CONFIG,
    ...config
})

/** Helper to get table params */
const getTableParams = (tableName: string): DynamoDB.CreateTableInput => ({
    TableName: tableName,
    KeySchema: [
        { AttributeName: attributeNames.COMPANY_CODE, KeyType: 'HASH' },
        { AttributeName: attributeNames.TIME, KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
        { AttributeName: attributeNames.COMPANY_CODE, AttributeType: 'S' },
        { AttributeName: attributeNames.TIME, AttributeType: 'S' },
        { AttributeName: attributeNames.RISK_LEVEL, AttributeType: 'S' },
        { AttributeName: attributeNames.NAME, AttributeType: 'S' },
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
        createCommonGSI({
            IndexName: indexNames.WEEK_PRICE_CHANGE_RATE,
            KeySchema: [
                { AttributeName: attributeNames.WEEK, KeyType: 'HASH' },
                { AttributeName: attributeNames.PRICE_CHANGE_RATE, KeyType: 'RANGE' },
            ],
        }),
        createCommonGSI({
            IndexName: indexNames.MONTH_PRICE_CHANGE_RATE,
            KeySchema: [
                { AttributeName: attributeNames.MONTH, KeyType: 'HASH' },
                { AttributeName: attributeNames.PRICE_CHANGE_RATE, KeyType: 'RANGE' },
            ],
        }),
        createCommonGSI({
            IndexName: indexNames.QUARTER_PRICE_CHANGE_RATE,
            KeySchema: [
                { AttributeName: attributeNames.QUARTER, KeyType: 'HASH' },
                { AttributeName: attributeNames.PRICE_CHANGE_RATE, KeyType: 'RANGE' },
            ],
        }),
        createCommonGSI({
            IndexName: indexNames.RECORDS_BY_RISK_LEVEL,
            KeySchema: [
                { AttributeName: attributeNames.RISK_LEVEL, KeyType: 'HASH' },
            ],
        }),
        createCommonGSI({
            IndexName: indexNames.RECORDS_BY_NAME,
            KeySchema: [
                { AttributeName: attributeNames.NAME, KeyType: 'HASH' },
            ],
        }),
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