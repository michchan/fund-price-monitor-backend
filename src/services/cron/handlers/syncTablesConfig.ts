import { ScheduledHandler } from 'aws-lambda'
import { DynamoDB } from 'aws-sdk'
import pipeAsync from 'simply-utils/dist/async/pipeAsync'
import wait from 'simply-utils/dist/async/wait'

import getCurrentYearAndQuarter from 'src/helpers/getCurrentYearAndQuarter'
import listTables from 'src/models/fundPriceRecord/io/listTables'
import updateTable from 'src/models/fundPriceRecord/io/updateTable'
import fromTableName from 'src/models/fundPriceRecord/utils/fromTableName'
import getTableParams from 'src/models/fundPriceRecord/utils/getTableParams'

const DELAY = 1000

/**
 * Sync tables configuration with updated code
 */
export const handler: ScheduledHandler = async () => {
  const tableNames = await listTables()

  await pipeAsync(
    ...tableNames.flatMap((tableName, i, arr) => {
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
        await updateTable(year, quarter, input)
        if (i < arr.length - 1) await wait(DELAY)
      }

      return [
        createHandler({
          AttributeDefinitions: params.AttributeDefinitions,
          ProvisionedThroughput: params.ProvisionedThroughput,
        }),
        createHandler({ GlobalSecondaryIndexUpdates: gsiDeleteList }),
        createHandler({ GlobalSecondaryIndexUpdates: gsiCreateList }),
        createHandler({ StreamSpecification: params.StreamSpecification }),
      ]
    })
  )()
}