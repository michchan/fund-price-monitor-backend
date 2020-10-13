import { DynamoDB } from "aws-sdk"
import { Quarter } from "simply-utils/dist/dateTime/getQuarter"

import getTableName from "../utils/getTableName"
import AWS from 'src/lib/AWS'


// Initialize
const dynamodb = new AWS.DynamoDB()

export interface Result extends DynamoDB.DescribeTableOutput {}

const describeTable = (
    /** In YYYY format */
    year: string | number,
    quarter: Quarter,
    input?: Omit<DynamoDB.DescribeTableInput, 'TableName'>,
): Promise<Result> => {
    // Get based table name
    const TableName = getTableName(year, quarter)
    // Update table
    return dynamodb.describeTable({ ...input, TableName }).promise()
}

export default describeTable