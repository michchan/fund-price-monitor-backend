import { DynamoDB, Lambda } from 'aws-sdk'
import { Quarter } from 'simply-utils/dateTime/getQuarter'

import AWS from 'src/lib/AWS'
import getTableName from '../utils/getTableName'
import waitForStream from 'src/lib/AWS/dynamodb/waitForStream'
import stringify from 'src/helpers/stringify'
import getTableParams from '../utils/getTableParams'

// Initialize
const dynamodb = new AWS.DynamoDB()
const lambda = new AWS.Lambda()

const createThisTable = async (year: string | number, quarter: Quarter) => {
  const TableName = getTableName(year, quarter)
  const createTableOutput = await dynamodb.createTable(getTableParams(TableName)).promise()
  // Wait for the table to be active
  await dynamodb.waitFor('tableExists', { TableName }).promise()
  return createTableOutput
}

const validateStreamCreation = async (createTableOutput: DynamoDB.CreateTableOutput) => {
  const streamArn = createTableOutput?.TableDescription?.LatestStreamArn
  const tableLogicalId = createTableOutput.TableDescription?.TableId
  if (!(streamArn && tableLogicalId)) {
    // Throw an error if the stream ARN is undefined. As it supposed to be defined.
    throw new Error(`createTableOutput invalid: ${stringify(createTableOutput)}`)
  }
  // Wait for the table's streams to be active
  await waitForStream({ StreamArn: streamArn })
  return streamArn
}

const createStreamEventSourceMapping = async (streamArn: string, streamHandlerArn: string) => {
  const eventSourceMapping = await lambda.createEventSourceMapping({
    // Assign function name passed
    FunctionName: streamHandlerArn,
    EventSourceArn: streamArn,
    StartingPosition: 'LATEST',
    MaximumRetryAttempts: STREAM_HANDLER_MAX_RETRY_ATTEMPTS,
  }).promise()

  const eventSrcMapId = eventSourceMapping.UUID
  if (!eventSrcMapId) {
    // Throw an error if the stream ARN is undefined. As it supposed to be defined.
    throw new Error(`eventSourceMapping invalid: ${stringify(eventSourceMapping)}`)
  }
  // Wait for function event-source mapping updated
  await lambda.waitFor('functionUpdated', { FunctionName: streamHandlerArn }).promise()
}

const STREAM_HANDLER_MAX_RETRY_ATTEMPTS = 10
export interface Output extends DynamoDB.CreateTableOutput {}
const createTable = async (
  /** In YYYY format */
  year: string | number,
  quarter: Quarter,
  streamHandlerArn: Lambda.CreateEventSourceMappingRequest['FunctionName'],
): Promise<Output> => {
  const createTableOutput = await createThisTable(year, quarter)
  const streamArn = await validateStreamCreation(createTableOutput)
  await createStreamEventSourceMapping(streamArn, streamHandlerArn)
  // Return the create table result
  return createTableOutput
}
export default createTable