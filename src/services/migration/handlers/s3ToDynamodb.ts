import { Handler } from 'aws-lambda'
import pipeAsync from 'simply-utils/dist/async/pipeAsync'
import wait from 'simply-utils/dist/async/wait'
import listAllS3Objects from 'simply-utils/dist/AWS/listAllS3Objects'
import { AttributeMap } from 'aws-sdk/clients/dynamodb'

import getBucketName from '../helpers/getBucketName'
import AWS from 'src/lib/AWS'
import fromTableRecordsS3ObjectKey from '../helpers/fromTableRecordsS3ObjectKey'
import { S3_RECORDS_CONTENT_TYPE } from '../constants'
import batchWriteItems from 'src/lib/AWS/dynamodb/batchWriteItems'

const s3 = new AWS.S3()
const TABLE_BATCH_DELAY = 1000

/**
 * Get unique objects by table name and
 * Take the latest ones for the same table
 */
const takeLatestObjectKeys = (objectKeys: string[]): string[] => {
  let prevUniqTable: null | string = null
  return objectKeys
    // It will be first sorted by table name,
    // And then second sorted by timestamp.
    .sort((a, b) => a > b ? -1 : 1)
    .filter(objectKey => {
      const tableName = fromTableRecordsS3ObjectKey(objectKey)
      if (tableName !== prevUniqTable) {
        prevUniqTable = tableName
        return true
      }
      return false
    })
}

const listObjectKeys = async (bucketName: string) => {
  const output = await listAllS3Objects(s3, bucketName)
  // We know it should have a "Contents" array of objects each of which contains "Key"
  const objectKeys = output.Contents?.map(({ Key }) => Key) as string[]
  return takeLatestObjectKeys(objectKeys)
}

const getRecordsFromFile = async (
  bucketName: string,
  objectKey: string
): Promise<AttributeMap[]> => {
  const output = await s3.getObject({
    Bucket: bucketName,
    Key: objectKey,
    ResponseContentType: S3_RECORDS_CONTENT_TYPE,
  }).promise()
  // We know it should have a string "Body" which is a stringified JSON array of "AttributeMap"
  return JSON.parse((output.Body ?? '[]') as string) as AttributeMap[]
}

const insertIntoTables = (
  tableName: string,
  records: AttributeMap[]
) => batchWriteItems(records, tableName, 'put')

/**
 * Environment:
 *  - BUCKET_NAME: string (required) - Name of the S3 bucket to get migrated data from
 */
export const handler: Handler = async () => {
  const bucketName = getBucketName()
  const objectKeys = await listObjectKeys(bucketName)
  // Manipulation for each table
  await pipeAsync(...objectKeys.map((objectKey, i, arr) => async () => {
    const records = await getRecordsFromFile(bucketName, objectKey)
    const tableName = fromTableRecordsS3ObjectKey(objectKey)
    await insertIntoTables(tableName, records)
    if (i < arr.length - 1) await wait(TABLE_BATCH_DELAY)
  }))()
}