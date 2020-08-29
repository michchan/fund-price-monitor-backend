import { DynamoDB, Lambda } from 'aws-sdk';
import { NonKeyAttributeNameList } from 'aws-sdk/clients/dynamodb';
import { StartingPosition } from '@aws-cdk/aws-lambda';

import AWS from 'lib/AWS'
import getTableName from '../utils/getTableName';
import { Quarter } from 'lib/helpers/getCurrentQuarter';
import attributeNames from '../constants/attributeNames';
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
                { AttributeName: attributeNames.WEEK, KeyType: 'HASH' },
                { AttributeName: attributeNames.PRICE_CHANGE_RATE, KeyType: 'RANGE' },
            ],
        }, [attributeNames.PRICE, attributeNames.NAME, attributeNames.UPDATED_DATE]),
        createInclusiveCSI({
            IndexName: indexNames.MONTH_PRICE_CHANGE_RATE,
            KeySchema: [
                { AttributeName: attributeNames.MONTH, KeyType: 'HASH' },
                { AttributeName: attributeNames.PRICE_CHANGE_RATE, KeyType: 'RANGE' },
            ],
        }, [attributeNames.PRICE, attributeNames.NAME, attributeNames.UPDATED_DATE]),
        createInclusiveCSI({
            IndexName: indexNames.QUARTER_PRICE_CHANGE_RATE,
            KeySchema: [
                { AttributeName: attributeNames.QUARTER, KeyType: 'HASH' },
                { AttributeName: attributeNames.PRICE_CHANGE_RATE, KeyType: 'RANGE' },
            ],
        }, [attributeNames.PRICE, attributeNames.NAME, attributeNames.UPDATED_DATE]),
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
    ],
    // Add stream for aggregation of top-level items
    StreamSpecification: {
        StreamEnabled: true,
        StreamViewType: 'NEW_AND_OLD_IMAGES',
    },
})