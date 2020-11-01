import { Handler } from 'aws-lambda'
import pipeAsync from 'simply-utils/dist/async/pipeAsync'
import wait from 'simply-utils/dist/async/wait'
import listAllS3Objects from 'simply-utils/dist/AWS/listAllS3Objects'

import getBucketName from '../helpers/getBucketName'
import AWS from 'src/lib/AWS'
import fromTableRecordsS3ObjectKey from '../helpers/fromTableRecordsS3ObjectKey'

const s3 = new AWS.S3()
const TABLE_BATCH_DELAY = 1000

const listObjectKeys = async (bucketName: string) => {
  const output = await listAllS3Objects(s3, bucketName)
  // We know it should have a "Contents" array of objects each of which contains "Key"
  return output.Contents?.map(({ Key }) => Key) as string[]
}

/**
 * Environment:
 *  - BUCKET_NAME: string (required) - Name of the S3 bucket to get migrated data from
 */
export const handler: Handler = async () => {
  const bucketName = getBucketName()
  const objectKeys = await listObjectKeys(bucketName)
  // Manipulation for each table
  await pipeAsync(...objectKeys.map((objectKey, i, arr) => async () => {
    const tableName = fromTableRecordsS3ObjectKey(objectKey)
    console.log(JSON.stringify({ i, objectKey, tableName }))
    if (i < arr.length - 1) await wait(TABLE_BATCH_DELAY)
  }))()
}