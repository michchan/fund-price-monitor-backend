import { DynamoDB } from 'aws-sdk'
import listAllDynamodbTables, { ListAllTablesResult } from 'simply-utils/dist/AWS/listAllDynamodbTables'
import getQuarter, { Quarter } from 'simply-utils/dist/dateTime/getQuarter'

import AWS from 'src/lib/AWS'
import getTableName from 'src/models/fundPriceRecord/utils/getTableName'

// Initialize
const dynamodb = new AWS.DynamoDB()

export type Result = DynamoDB.TableNameList

const listAllTables = (
  exclusiveStartYear?: string | number,
  exclusiveStartQuarter?: Quarter,
  Limit?: DynamoDB.ListTablesInput['Limit'],
): Promise<ListAllTablesResult> => {
  const yr = exclusiveStartYear ?? new Date(0).getFullYear()
  const qt = exclusiveStartQuarter ?? getQuarter(new Date(0))
  const exclusiveStartTableName = getTableName(yr, qt)

  return listAllDynamodbTables(dynamodb, exclusiveStartTableName, Limit)
}

export default listAllTables