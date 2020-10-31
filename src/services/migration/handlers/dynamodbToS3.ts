import { Handler } from 'aws-lambda'
import { AttributeMap } from 'aws-sdk/clients/dynamodb'
import pipeAsync from 'simply-utils/dist/async/pipeAsync'
import wait from 'simply-utils/dist/async/wait'
import omit from 'lodash/omit'

import listTables from 'src/models/fundPriceRecord/io/listTables'
import fromTableName from 'src/models/fundPriceRecord/utils/fromTableName'
import queryItemsByCompany, { EXP_TIME_SK } from 'src/models/fundPriceRecord/io/queryItemsByCompany'
import AWS from 'src/lib/AWS'
import { CompanyType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import pipeByCompany from 'src/models/fundPriceRecord/utils/pipeByCompany'

const s3 = new AWS.S3()
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
  return output.Items ?? []
}

const getRecords = (tableName: string) => pipeByCompany<AttributeMap[]>(input => async company => {
  const companyRecords = await getCompanyManipulator(tableName)(company)
  return [...input, ...companyRecords]
}, [])

const putObjectToS3 = (
  bucketName: string,
  tableName: string,
  records: AttributeMap[]
) => s3.putObject({
  Bucket: bucketName,
  Key: `${tableName}_${new Date().getTime()}`,
  Body: records,
}).promise()

/**
 * Environment:
 *  - BUCKET_NAME: string (required) - S3 bucket name to store migrated data
 */
export const handler: Handler = async () => {
  const bucketName = process.env.BUCKET_NAME
  if (!bucketName) throw new Error('Environment variable BUCKET_NAME undefined')

  // Get list of table names
  const tableNames = await listTables()
  // Manipulation for each table
  await pipeAsync(...tableNames.map((tableName, i, arr) => async () => {
    const records = await getRecords(tableName)
    await putObjectToS3(bucketName, tableName, records)
    if (i < arr.length - 1) await wait(TABLE_BATCH_DELAY)
  }))()
}