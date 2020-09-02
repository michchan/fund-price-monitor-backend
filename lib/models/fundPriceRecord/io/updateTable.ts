import { DynamoDB } from "aws-sdk"
import { Quarter } from "simply-utils/dist/dateTime/getQuarter"

import getTableName from "../utils/getTableName";
import AWS from 'lib/AWS/AWS'
import waitForService from "lib/helpers/waitForService";


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
): Promise<Result> => {
    // Get based table name
    const TableName = getTableName(year, quarter);
    // Update table
    const output = await dynamodb.updateTable({ ...input, TableName }).promise();
    // Wait for status to be finished as "ACTIVE" (changing from "UPDATING")
    await waitForService<I, O, E>(dynamodb.describeTable, { TableName }, result => {
        return /^ACTIVE$/i.test(result?.Table?.TableStatus ?? '');
    });

    return output
}

export default updateTable