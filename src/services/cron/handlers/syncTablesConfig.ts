import { ScheduledHandler } from 'aws-lambda'
import { DynamoDB } from 'aws-sdk'
import pick from 'lodash/pick'
import isEqual from 'lodash/isEqual'
import isFunction from 'lodash/isFunction'
import pipeAsync from 'simply-utils/dist/async/pipeAsync'
import wait from 'simply-utils/dist/async/wait'
import generateRandomString from 'simply-utils/dist/string/generateRandomString'

import getCurrentYearAndQuarter from 'src/helpers/getCurrentYearAndQuarter'
import listTables from 'src/models/fundPriceRecord/io/listTables'
import updateTable from 'src/models/fundPriceRecord/io/updateTable'
import fromTableName from 'src/models/fundPriceRecord/utils/fromTableName'
import getTableParams from 'src/models/fundPriceRecord/utils/getTableParams'
import logObj from 'src/helpers/logObj'

type TableDesc = DynamoDB.TableDescription
type AttrDef = Pick<DynamoDB.AttributeDefinition, 'AttributeName'>

const dynamodb = new DynamoDB()
const DELAY = 1000

const THROUGHPUT_COMPARE_ATTRS = ['ReadCapacityUnits', 'WriteCapacityUnits']

const sortAttr = (a: AttrDef, b: AttrDef): number => {
  if (a.AttributeName > b.AttributeName) return -1
  if (b.AttributeName < a.AttributeName) return 1
  return 0
}
const sortStr = (a: string, b: string): number => {
  if (a > b) return -1
  if (b < a) return 1
  return 0
}

/**
 * Sync tables configuration with updated code
 */
// @TODO: Refractor functions
/* eslint-disable max-lines-per-function */
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

      const gsiUpdateList = GlobalSecondaryIndexes
        ?.filter(({ IndexName, ProvisionedThroughput }) => {
          if (!ProvisionedThroughput) return false
          const prevGsi = tableDesc.GlobalSecondaryIndexes?.find(c => c.IndexName === IndexName)
          if (prevGsi) {
            return !isEqual(
              pick(prevGsi.ProvisionedThroughput, THROUGHPUT_COMPARE_ATTRS),
              pick(ProvisionedThroughput, THROUGHPUT_COMPARE_ATTRS),
            )
          }
          // No corresponding GSI
          return false
        })
        ?.map(gsi => ({
          Update: pick(gsi, ['IndexName', 'ProvisionedThroughput']) as DynamoDB.UpdateGlobalSecondaryIndexAction,
        }))

      const gsiCreateList = GlobalSecondaryIndexes
        ?.filter(({ IndexName, KeySchema, Projection }) => {
          const prevGsi = tableDesc.GlobalSecondaryIndexes?.find(c => c.IndexName === IndexName)
          if (prevGsi) {
            const hasKeySchemaChanged = !isEqual(
              [...(prevGsi.KeySchema || [])].sort(sortAttr),
              [...(KeySchema || [])].sort(sortAttr)
            )
            const hasProjectionChanged = !isEqual(
              {
                ...prevGsi.Projection,
                NonKeyAttributes: prevGsi.Projection?.NonKeyAttributes?.sort(sortStr),
              },
              {
                ...Projection,
                NonKeyAttributes: Projection?.NonKeyAttributes?.sort(sortStr),
              },
            )
            return hasKeySchemaChanged || hasProjectionChanged
          }
          // Create new GSI
          return true
        })
        ?.map(gsi => ({
          Create: gsi as DynamoDB.CreateGlobalSecondaryIndexAction,
        }))

      const gsiDeleteList = [
        ...(tableDesc.GlobalSecondaryIndexes || [])
          .filter(({ IndexName }) => {
            const nextGsi = GlobalSecondaryIndexes?.find(c => c.IndexName === IndexName)
            if (!nextGsi) return true
            return false
          }),
        ...gsiCreateList.map(c => c.Create),
      ].map(({ IndexName }) => ({
        Delete: { IndexName } as DynamoDB.DeleteGlobalSecondaryIndexAction,
      }))

      const createHandler = (input: Omit<DynamoDB.UpdateTableInput, 'TableName'>) => async () => {
        const updateId = generateRandomString()
        logObj(`[${updateId}] Updating ${tableName}: `, input)
        await updateTable(year, quarter, input, true)
        logObj(`[${updateId}] UPDATED ${tableName}`, {})
        if (i < arr.length - 1) await wait(DELAY)
      }
      const mapGsiActionToHandler = (
        action: DynamoDB.GlobalSecondaryIndexUpdate
      ) => createHandler({
        AttributeDefinitions: params.AttributeDefinitions,
        GlobalSecondaryIndexUpdates: [action],
      })

      const isAttrChanged = !isEqual(
        [...(tableDesc.AttributeDefinitions || [])].sort(sortAttr),
        [...params.AttributeDefinitions].sort(sortAttr)
      )
      const isThroughputChanged = !isEqual(
        pick(tableDesc.ProvisionedThroughput, THROUGHPUT_COMPARE_ATTRS),
        pick(params.ProvisionedThroughput, THROUGHPUT_COMPARE_ATTRS),
      )
      const isStreamSpecChanged = !(
        !params.StreamSpecification?.StreamEnabled
        && !tableDesc.StreamSpecification?.StreamEnabled
      ) && !isEqual(
        tableDesc.StreamSpecification,
        params.StreamSpecification
      )

      logObj(`Attributes Change (${tableName}): `, {
        isAttrChanged,
        table: tableDesc.AttributeDefinitions,
        params: params.AttributeDefinitions,
      })
      logObj(`Throughput Change (${tableName}): `, {
        isThroughputChanged,
        table: tableDesc.ProvisionedThroughput,
        params: params.ProvisionedThroughput,
      })
      logObj(`Stream spec Change (${tableName}): `, {
        isStreamSpecChanged,
        table: tableDesc.StreamSpecification,
        params: params.StreamSpecification,
      })
      logObj(`GSI Change (${tableName}): `, {
        gsiUpdateList,
        gsiCreateList,
        gsiDeleteList,
        table: tableDesc.GlobalSecondaryIndexes,
        params: params.GlobalSecondaryIndexes,
      })

      return [
        isThroughputChanged
          && createHandler({ ProvisionedThroughput: params.ProvisionedThroughput }),
        isStreamSpecChanged && createHandler({ StreamSpecification: params.StreamSpecification }),
        ...gsiUpdateList.map(mapGsiActionToHandler),
        ...gsiDeleteList.map(mapGsiActionToHandler),
        ...gsiCreateList.map(mapGsiActionToHandler),
      ].filter(isFunction)
    })
  )()
}