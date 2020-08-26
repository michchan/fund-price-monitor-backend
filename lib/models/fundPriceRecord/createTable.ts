import { DynamoDB } from 'aws-sdk';

import AWS from 'lib/AWS'
import getTableName from './getTableName';
import { Quarter } from 'lib/helpers/getCurrentQuarter';


// Initialize
const dynamodb = new AWS.DynamoDB();

export interface Result extends DynamoDB.CreateTableOutput {};

const createTable = (
    /** In YYYY format */
    year: string | number,
    quarter: Quarter,
): Promise<Result> => new Promise((resolve, reject) => {
    dynamodb.createTable({
        TableName: getTableName(year, quarter),
        KeySchema: [
            // Partition key
            { AttributeName: 'company_code', KeyType: 'HASH' },
            // Sort key
            { AttributeName: 'record_time', KeyType: 'RANGE' },
        ],
        AttributeDefinitions: [
            // Partition key
            { AttributeName: 'company_code', AttributeType: 'S' },
            // Sort key
            { AttributeName: 'record_time', AttributeType: 'S' },
        ],
        // Every created table are regarded as a table containing the latest time series data,
        // So assign the best capacity units.
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 1,
        }
    }, (err, data) => {
        if (err) {
            reject(new Error(`Unable to create table. Error JSON: ${err}`));
        } else {
            resolve(data);
        }
    })
})
export default createTable