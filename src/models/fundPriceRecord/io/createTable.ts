import { DynamoDB, Lambda } from 'aws-sdk'
import { NonKeyAttributeNameList } from 'aws-sdk/clients/dynamodb'
import { StartingPosition } from '@aws-cdk/aws-lambda'
import { Quarter } from 'simply-utils/dist/dateTime/getQuarter'

import AWS from 'src/lib/AWS'
import getTableName from '../utils/getTableName'
import attrs from '../constants/attributeNames'
import indexNames from '../constants/indexNames'
import waitForStream from 'src/lib/AWS/dynamodb/waitForStream'
import stringify from 'src/helpers/stringify'

// Initialize
const dynamodb = new AWS.DynamoDB()
const lambda = new AWS.Lambda()

/** Common throughput for GSI */
const GSI_COMMON_THROUGHPUT: DynamoDB.GlobalSecondaryIndex['ProvisionedThroughput'] = {
  ReadCapacityUnits: 1,
  WriteCapacityUnits: 1,
}

/** Helper to create common GSI */
const createInclusiveGSI = (
  config: Pick<DynamoDB.GlobalSecondaryIndex, 'IndexName' | 'KeySchema'>,
  NonKeyAttributes: NonKeyAttributeNameList,
): DynamoDB.GlobalSecondaryIndex => ({
  Projection: {
    ProjectionType: 'INCLUDE',
    NonKeyAttributes,
  },
  ProvisionedThroughput: GSI_COMMON_THROUGHPUT,
  ...config,
})

const priceChangeRateGSI = createInclusiveGSI({
  IndexName: indexNames.PERIOD_PRICE_CHANGE_RATE,
  KeySchema: [
    { AttributeName: attrs.PERIOD, KeyType: 'HASH' },
    { AttributeName: attrs.PRICE_CHANGE_RATE, KeyType: 'RANGE' },
  ],
}, [
  attrs.PRICE,
  attrs.NAME,
  attrs.UPDATED_DATE,
  attrs.PRICE_LIST,
])
const recordsByCompanyGSI = createInclusiveGSI({
  IndexName: indexNames.RECORDS_BY_COMPANY,
  KeySchema: [{ AttributeName: attrs.COMPANY, KeyType: 'HASH' }],
}, [
  attrs.PRICE,
  attrs.PRICE_CHANGE_RATE,
  attrs.NAME,
  attrs.UPDATED_DATE,
])
const recordsByRiskLevelGSI = createInclusiveGSI({
  IndexName: indexNames.RECORDS_BY_RISK_LEVEL,
  KeySchema: [{ AttributeName: attrs.RISK_LEVEL, KeyType: 'HASH' }],
}, [
  attrs.PRICE,
  attrs.PRICE_CHANGE_RATE,
  attrs.NAME,
  attrs.UPDATED_DATE,
])

const KeySchema = [
  { AttributeName: attrs.COMPANY_CODE, KeyType: 'HASH' },
  { AttributeName: attrs.TIME_SK, KeyType: 'RANGE' },
]
const AttributeDefinitions = [
  { AttributeName: attrs.COMPANY_CODE, AttributeType: 'S' },
  { AttributeName: attrs.TIME_SK, AttributeType: 'S' },
  { AttributeName: attrs.COMPANY, AttributeType: 'S' },
  { AttributeName: attrs.RISK_LEVEL, AttributeType: 'S' },
  { AttributeName: attrs.PERIOD, AttributeType: 'S' },
  { AttributeName: attrs.PRICE_CHANGE_RATE, AttributeType: 'N' },
]

const GlobalSecondaryIndexes = [
  priceChangeRateGSI,
  recordsByCompanyGSI,
  recordsByRiskLevelGSI,
]

const StreamSpecification = {
  StreamEnabled: true,
  StreamViewType: 'NEW_AND_OLD_IMAGES',
}

const ReadCapacityUnits = 2
const WriteCapacityUnits = 1
/** Helper to get table params */
const getTableParams = (TableName: string): DynamoDB.CreateTableInput => ({
  TableName,
  KeySchema,
  AttributeDefinitions,
  // Every created table are regarded as a table containing the latest timeSK series data,
  // So assign the best capacity units.
  ProvisionedThroughput: {
    ReadCapacityUnits,
    WriteCapacityUnits,
  },
  GlobalSecondaryIndexes,
  // Add stream for aggregation of top-level items
  StreamSpecification,
})

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
    StartingPosition: StartingPosition.LATEST,
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