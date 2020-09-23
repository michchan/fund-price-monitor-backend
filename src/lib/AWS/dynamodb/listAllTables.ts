import { DynamoDB } from 'aws-sdk';
import listAllDynamodbTables, { ListAllTablesResult } from 'simply-utils/dist/AWS/listAllDynamodbTables'

import AWS from 'src/lib/AWS'


// Initialize
const dynamodb = new AWS.DynamoDB();

export type Result = DynamoDB.TableNameList

const listAllTables = (
    ExclusiveStartTableName: string,
    Limit?: DynamoDB.ListTablesInput['Limit'],
): Promise<ListAllTablesResult> => listAllDynamodbTables(dynamodb, ExclusiveStartTableName, Limit)

export default listAllTables