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
import { S3_RECORDS_CONTENT_TYPE } from '../constants'
import toTableRecordsS3ObjectKey from '../helpers/toTableRecordsS3ObjectKey'
import getBucketName from '../helpers/getBucketName'

const s3 = new AWS.S3()
const TABLE_BATCH_DELAY = 1000

const getRecordsGetter = (tableName: string) => async (company: CompanyType) => {
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
  const companyRecords = await getRecordsGetter(tableName)(company)
  return [...input, ...companyRecords]
}, [])

const putObjectToS3 = (
  bucketName: string,
  tableName: string,
  records: AttributeMap[]
) => s3.putObject({
  Bucket: bucketName,
  Key: toTableRecordsS3ObjectKey(tableName),
  Body: JSON.stringify(records),
  ContentType: S3_RECORDS_CONTENT_TYPE,
}).promise()

/**
 * Environment:
 *  - BUCKET_NAME: string (required) - Name of the S3 bucket to store migrated data
 */
export const handler: Handler = async () => {
  const bucketName = getBucketName()
  // Get list of table names
  const tableNames = await listTables()
  // Manipulation for each table
  await pipeAsync(...tableNames.map((tableName, i, arr) => async () => {
    const records = await getRecords(tableName)
    await putObjectToS3(bucketName, tableName, records)
    if (i < arr.length - 1) await wait(TABLE_BATCH_DELAY)
  }))()
}