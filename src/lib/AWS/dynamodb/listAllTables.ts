import { DynamoDB } from 'aws-sdk'
import listAllDynamodbTables, { ListAllTablesResult } from 'simply-utils/AWS/listAllDynamodbTables'
import getQuarter, { Quarter } from 'simply-utils/dateTime/getQuarter'

import AWS from 'src/lib/AWS'
import getTableName from 'src/models/fundPriceRecord/utils/getTableName'

// Initialize
const dynamodb = new AWS.DynamoDB()
const DEFAULT_DELAY = 300

export type Output = ListAllTablesResult

const listAllTables = (
  exclusiveStartYear?: string | number,
  exclusiveStartQuarter?: Quarter,
  Limit?: DynamoDB.ListTablesInput['Limit'],
  delay: number = DEFAULT_DELAY,
): Promise<Output> => {
  const yr = exclusiveStartYear ?? new Date(0).getFullYear()
  const qt = exclusiveStartQuarter ?? getQuarter(new Date(0))
  const exclusiveStartTableName = getTableName(yr, qt)

  return listAllDynamodbTables(dynamodb, exclusiveStartTableName, { Limit, delay })
}

export default listAllTables