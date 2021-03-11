import { ScheduledHandler } from 'aws-lambda'
import { DynamoDB } from 'aws-sdk'
import pick from 'lodash/pick'
import isEqual from 'lodash/isEqual'
import isFunction from 'lodash/isFunction'
import pipeAsync from 'simply-utils/dist/async/pipeAsync'
import wait from 'simply-utils/dist/async/wait'

import getCurrentYearAndQuarter from 'src/helpers/getCurrentYearAndQuarter'
import listTables from 'src/models/fundPriceRecord/io/listTables'
import updateTable from 'src/models/fundPriceRecord/io/updateTable'
import fromTableName from 'src/models/fundPriceRecord/utils/fromTableName'
import getTableParams from 'src/models/fundPriceRecord/utils/getTableParams'
import logObj from 'src/helpers/logObj'

type TableDesc = DynamoDB.TableDescription
type AttrDef = DynamoDB.AttributeDefinition

const dynamodb = new DynamoDB()
const DELAY = 1000

const THROUGHPUT_COMPARE_ATTRS = ['ReadCapacityUnits', 'WriteCapacityUnits']

const sortAttr = (a: AttrDef, b: AttrDef): number => {
  if (a.AttributeName > b.AttributeName) return -1
  if (b.AttributeName < a.AttributeName) return 1
  return 0
}

/**
 * Sync tables configuration with updated code
 */
export const handler: ScheduledHandler = async () => {
  const tableNames = await listTables()
  const tableDescriptions = await pipeAsync<TableDesc[]>(
    ...tableNames.map(TableName => async (prev: any) => {
      const { Table } = await dynamodb.describeTable({ TableName }).promise()
      return [...prev, Table]
    })
  )([] as TableDesc[])

  await pipeAsync(
    ...tableNames.flatMap((tableName, i, arr) => {
      const tableDesc = tableDescriptions[i]
      const [currentYear, currentQuarter] = getCurrentYearAndQuarter()
      const { year, quarter } = fromTableName(tableName)
      const isActive = (
        Number(currentYear) === Number(year)
        && Number(currentQuarter) === Number(quarter)
      )
      const params = getTableParams(tableName, isActive)
      const { GlobalSecondaryIndexes = [] } = params

      const gsiDeleteList = GlobalSecondaryIndexes?.map(({ IndexName }) => ({
        Delete: { IndexName },
      }))
      const gsiCreateList = GlobalSecondaryIndexes?.map(gsi => ({
        Create: gsi,
      }))

      const createHandler = (input: Omit<DynamoDB.UpdateTableInput, 'TableName'>) => async () => {
        await updateTable(year, quarter, input, true)
        if (i < arr.length - 1) await wait(DELAY)
      }

      const isAttrChanged = !isEqual(
        [...(tableDesc.AttributeDefinitions || [])].sort(sortAttr),
        [...params.AttributeDefinitions].sort(sortAttr)
      )
      const isThroughputChanged = !isEqual(
        pick(tableDesc.ProvisionedThroughput, THROUGHPUT_COMPARE_ATTRS),
        pick(params.ProvisionedThroughput, THROUGHPUT_COMPARE_ATTRS),
      )
      const isGSIChanged = !isEqual(
        tableDesc.GlobalSecondaryIndexes,
        GlobalSecondaryIndexes
      )
      const isStreamSpecChanged = !(
        !params.StreamSpecification?.StreamEnabled
        && !tableDesc.StreamSpecification?.StreamEnabled
      ) && !isEqual(
        tableDesc.StreamSpecification,
        params.StreamSpecification
      )
      logObj('Changed parts in input: ', {
        isAttrChanged,
        isThroughputChanged,
        isGSIChanged,
        isStreamSpecChanged,
      })

      return [
        isAttrChanged && createHandler({ AttributeDefinitions: params.AttributeDefinitions }),
        isThroughputChanged
          && createHandler({ ProvisionedThroughput: params.ProvisionedThroughput }),
        isGSIChanged && createHandler({ GlobalSecondaryIndexUpdates: gsiDeleteList }),
        isGSIChanged && createHandler({ GlobalSecondaryIndexUpdates: gsiCreateList }),
        isStreamSpecChanged && createHandler({ StreamSpecification: params.StreamSpecification }),
      ].filter(isFunction)
    })
  )()
}