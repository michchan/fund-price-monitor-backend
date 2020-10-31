import { Handler } from 'aws-lambda'
import pipeAsync from 'simply-utils/dist/async/pipeAsync'
import wait from 'simply-utils/dist/async/wait'
import omit from 'lodash/omit'

import listTables from 'src/models/fundPriceRecord/io/listTables'
import fromTableName from 'src/models/fundPriceRecord/utils/fromTableName'
import queryItemsByCompany, { EXP_TIME_SK } from 'src/models/fundPriceRecord/io/queryItemsByCompany'
import forEachCompany from 'src/models/fundPriceRecord/utils/forEachCompany'

const TABLE_BATCH_DELAY = 1000

export const handler: Handler = async () => {
  // Get list of table names
  const tableNames = await listTables()
  // Manipulation for each table
  await pipeAsync(...tableNames.map((tableName, i, arr) => async () => {
    await forEachCompany(async company => {
      const output = await queryItemsByCompany(company, {
        shouldQueryAll: true,
        shouldQueryLatest: false,
        at: fromTableName(tableName),
        input: defaultInput => ({
          // Cancel filter expression
          FilterExpression: undefined,
          // Remove unused values
          ExpressionAttributeValues: omit(
            defaultInput.ExpressionAttributeValues,
            EXP_TIME_SK
          ),
        }),
      })
      console.log(JSON.stringify({ i, company, length: output.Items?.length }))
    })
    if (i < arr.length - 1) await wait(TABLE_BATCH_DELAY)
  }))()
}