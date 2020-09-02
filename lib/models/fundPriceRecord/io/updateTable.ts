import { DynamoDB } from "aws-sdk"
import { Quarter } from "simply-utils/dist/dateTime/getQuarter"

import getTableName from "../utils/getTableName";
import AWS from 'lib/AWS/AWS'


// Initialize
const dynamodb = new AWS.DynamoDB();

export interface Result extends DynamoDB.UpdateTableOutput {};

const updateTable = (
    /** In YYYY format */
    year: string | number,
    quarter: Quarter,
    input: Omit<DynamoDB.UpdateTableInput, 'TableName'>,
): Promise<Result> => {
    // Get based table name
    const TableName = getTableName(year, quarter);
    // Update table
    return dynamodb.updateTable({ ...input, TableName }).promise();
}

export default updateTable