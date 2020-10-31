import { Handler } from 'aws-lambda'
import { AttributeMap } from 'aws-sdk/clients/dynamodb'
import pipeAsync from 'simply-utils/dist/async/pipeAsync'
import wait from 'simply-utils/dist/async/wait'
import omit from 'lodash/omit'

import listTables from 'src/models/fundPriceRecord/io/listTables'
import fromTableName from 'src/models/fundPriceRecord/utils/fromTableName'
import queryItemsByCompany, { EXP_TIME_SK } from 'src/models/fundPriceRecord/io/queryItemsByCompany'
// !import AWS from 'src/lib/AWS'
import { CompanyType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import pipeByCompany from 'src/models/fundPriceRecord/utils/pipeByCompany'

// != new AWS.S3()
const TABLE_BATCH_DELAY = 1000

const getCompanyManipulator = (tableName: string) => async (company: CompanyType) => {
  const output = await queryItemsByCompany(company, {
    shouldQueryAll: true,
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
  console.log(JSON.stringify({ company, length: output.Items?.length }))
  return output.Items ?? []
}

export const handler: Handler = async () => {
  // Get list of table names
  const tableNames = await listTables()
  // Manipulation for each table
  await pipeAsync(...tableNames.map((tableName, i, arr) => async () => {
    const records = await pipeByCompany<AttributeMap[]>(input => async company => {
      const companyRecords = await getCompanyManipulator(tableName)(company)
      return [...input, ...companyRecords]
    }, [])
    console.log(JSON.stringify({ i, tableName, length: records.length }, null, 2))
    if (i < arr.length - 1) await wait(TABLE_BATCH_DELAY)
  }))()
}