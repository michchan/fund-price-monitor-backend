import { DynamoDB, Lambda } from 'aws-sdk';
import { NonKeyAttributeNameList } from 'aws-sdk/clients/dynamodb';
import { StartingPosition } from '@aws-cdk/aws-lambda';

import AWS from 'lib/AWS/AWS'
import getTableName from '../utils/getTableName';
import { Quarter } from 'lib/helpers/getQuarter';
import attrs from '../constants/attributeNames';
import indexNames from '../constants/indexNames';
import db from 'lib/AWS/dynamodb';


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
    /** ------------- Create table ------------- */

    // Get based table name
    const TableName = getTableName(year, quarter)
    // Send create table request
    const createdTable = await dynamodb.createTable(getTableParams(TableName)).promise()
    // Wait for the table to be active
    await dynamodb.waitFor('tableExists', { TableName }).promise();

    /** ------------- Check create table result ------------- */

    // Get stream ARN
    const StreamArn = createdTable?.TableDescription?.LatestStreamArn;
    // Get table logicalID
    const tableLogicalId = createdTable.TableDescription?.TableId
    // Abort if the following are not defined
    if (!(StreamArn && tableLogicalId)) {
        // Throw an error if the stream ARN is undefined. As it supposed to be defined.
        throw new Error(`createdTable invalid: ${JSON.stringify(createdTable, null, 2)}`)
    }

    /** ------------- Create stream and function event mapping ------------- */

    // Wait for the table's streams to be active
    await db.waitForStream({ StreamArn });
    // Create event source mapping request
    const eventSourceMapping = await lambda.createEventSourceMapping({
        // Assign function name passed
        FunctionName: streamHandlerArn,
        EventSourceArn: StreamArn,
        StartingPosition: StartingPosition.LATEST,
        MaximumRetryAttempts: 10,
    }).promise();

    // Get event source mapping logical ID
    const eventSrcMapId = eventSourceMapping.UUID
    // Abort if the following are not defined
    if (!(eventSrcMapId)) {
        // Throw an error if the stream ARN is undefined. As it supposed to be defined.
        throw new Error(`eventSourceMapping invalid: ${JSON.stringify(eventSourceMapping, null, 2)}`)
    }

    // Wait for function event-source mapping updated
    await lambda.waitFor('functionUpdated', { FunctionName: streamHandlerArn }).promise();
    // Return the create table result
    return createdTable
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
            IndexName: indexNames.TIME_PRICE_CHANGE_RATE,
            KeySchema: [
                { AttributeName: attrs.TIME_SK, KeyType: 'HASH' },
                { AttributeName: attrs.PRICE_CHANGE_RATE, KeyType: 'RANGE' },
            ],
        }, [attrs.PRICE, attrs.NAME, attrs.UPDATED_DATE, attrs.PRICE_LIST]),
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