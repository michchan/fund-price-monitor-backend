import { DynamoDB, Lambda } from 'aws-sdk';
import { NonKeyAttributeNameList } from 'aws-sdk/clients/dynamodb';
import { StartingPosition } from '@aws-cdk/aws-lambda';

import AWS from 'lib/AWS'
import getTableName from '../utils/getTableName';
import { Quarter } from 'lib/helpers/getQuarter';
import attrs from '../constants/attributeNames';
import indexNames from '../constants/indexNames';


// Initialize
const dynamodb = new AWS.DynamoDB();
const lambda = new AWS.Lambda();

export interface Result extends DynamoDB.CreateTableOutput {};

const createTable = async (
    /** In YYYY format */
    year: string | number,
    quarter: Quarter,
    streamHandlerArn: Lambda.CreateEventSourceMappingRequest['FunctionName'],
): Promise<Result> => {
    // Get based table name
    const TableName = getTableName(year, quarter)
    // Send create table request
    const createTableResult = await dynamodb.createTable(getTableParams(TableName)).promise()
    // Wait for the table to be active
    await dynamodb.waitFor('tableExists', { TableName }).promise();

    // Create event source mapping for dynamodb stream and the handler
    if (createTableResult?.TableDescription?.LatestStreamArn) {
        // Create event source mapping request
        await lambda.createEventSourceMapping({
            // Assign function name passed
            FunctionName: streamHandlerArn,
            EventSourceArn: createTableResult.TableDescription.LatestStreamArn,
            StartingPosition: StartingPosition.LATEST,
        }).promise()
        // Wait for function event-source mapping updated
        await lambda.waitFor('functionUpdated', { FunctionName: streamHandlerArn }).promise();
    }

    // Return the create table result
    return createTableResult
}
export default createTable


/** Common throughput for GSI */
const GSI_COMMON_THROUGHPUT: DynamoDB.GlobalSecondaryIndex['ProvisionedThroughput'] = {
    ReadCapacityUnits: 1,
    WriteCapacityUnits: 1,
}

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
const getTableParams = (TableName: string): DynamoDB.CreateTableInput => ({
    TableName: TableName,
    KeySchema: [
        { AttributeName: attrs.COMPANY_CODE, KeyType: 'HASH' },
        { AttributeName: attrs.TIME_SK, KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
        { AttributeName: attrs.COMPANY_CODE, AttributeType: 'S' },
        { AttributeName: attrs.TIME_SK, AttributeType: 'S' },
        { AttributeName: attrs.COMPANY, AttributeType: 'S' },
        { AttributeName: attrs.RISK_LEVEL, AttributeType: 'S' },
        { AttributeName: attrs.WEEK, AttributeType: 'S' },
        { AttributeName: attrs.MONTH, AttributeType: 'S' },
        { AttributeName: attrs.QUARTER, AttributeType: 'S' },
        { AttributeName: attrs.PRICE_CHANGE_RATE, AttributeType: 'N' },
    ],
    // Every created table are regarded as a table containing the latest timeSK series data,
    // So assign the best capacity units.
    ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 1,
    },
    GlobalSecondaryIndexes: [
        createInclusiveCSI({
            IndexName: indexNames.WEEK_PRICE_CHANGE_RATE,
            KeySchema: [
                { AttributeName: attrs.WEEK, KeyType: 'HASH' },
                { AttributeName: attrs.PRICE_CHANGE_RATE, KeyType: 'RANGE' },
            ],
        }, [attrs.PRICE, attrs.NAME, attrs.UPDATED_DATE]),
        createInclusiveCSI({
            IndexName: indexNames.MONTH_PRICE_CHANGE_RATE,
            KeySchema: [
                { AttributeName: attrs.MONTH, KeyType: 'HASH' },
                { AttributeName: attrs.PRICE_CHANGE_RATE, KeyType: 'RANGE' },
            ],
        }, [attrs.PRICE, attrs.NAME, attrs.UPDATED_DATE]),
        createInclusiveCSI({
            IndexName: indexNames.QUARTER_PRICE_CHANGE_RATE,
            KeySchema: [
                { AttributeName: attrs.QUARTER, KeyType: 'HASH' },
                { AttributeName: attrs.PRICE_CHANGE_RATE, KeyType: 'RANGE' },
            ],
        }, [attrs.PRICE, attrs.NAME, attrs.UPDATED_DATE]),
        createInclusiveCSI({
            IndexName: indexNames.RECORDS_BY_COMPANY,
            KeySchema: [
                { AttributeName: attrs.COMPANY, KeyType: 'HASH' },
            ],
        }, [attrs.PRICE, attrs.NAME, attrs.UPDATED_DATE]),
        createInclusiveCSI({
            IndexName: indexNames.RECORDS_BY_RISK_LEVEL,
            KeySchema: [
                { AttributeName: attrs.RISK_LEVEL, KeyType: 'HASH' },
            ],
        }, [attrs.PRICE, attrs.NAME, attrs.UPDATED_DATE]),
    ],
    // Add stream for aggregation of top-level items
    StreamSpecification: {
        StreamEnabled: true,
        StreamViewType: 'NEW_AND_OLD_IMAGES',
    },
})