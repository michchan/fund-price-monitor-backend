import { DynamoDB } from "aws-sdk"
import { Quarter } from "simply-utils/dist/dateTime/getQuarter"
import waitForAWSService from 'simply-utils/dist/AWS/waitForAWSService'

import getTableName from "../utils/getTableName";
import AWS from 'src/lib/AWS'


// Initialize
const dynamodb = new AWS.DynamoDB();

type I = DynamoDB.DescribeTableInput
type O = DynamoDB.DescribeTableOutput
type E = AWS.AWSError

export interface Result extends DynamoDB.UpdateTableOutput {};

const updateTable = async (
    /** In YYYY format */
    year: string | number,
    quarter: Quarter,
    input: Omit<DynamoDB.UpdateTableInput, 'TableName'>,
    shouldWaitForUpdateComplete?: boolean,
): Promise<Result> => {
    // Get based table name
    const TableName = getTableName(year, quarter);
    // Update table
    const output = await dynamodb.updateTable({ ...input, TableName }).promise();

    if (shouldWaitForUpdateComplete) {
        // Wait for status to be finished as "ACTIVE" (changing from "UPDATING")
        await waitForAWSService<I, O, E>(
            // Prevent `this` context problem
            (...args) => dynamodb.describeTable(...args), 
            // Input
            { TableName }, 
            // Predicate of whether the table has been changed to ACTIVE (update completed)
            result => /^ACTIVE$/i.test(result?.Table?.TableStatus ?? '')
        );
    }

    return output
}

export default updateTable