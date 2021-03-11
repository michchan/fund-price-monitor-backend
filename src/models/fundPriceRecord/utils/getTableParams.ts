import { DynamoDB } from 'aws-sdk'
import { NonKeyAttributeNameList } from 'aws-sdk/clients/dynamodb'

import attrs from '../constants/attributeNames'
import indexNames from '../constants/indexNames'
import tableThroughput from '../constants/tableThroughput'

const RECORD_PROJECTED_ATTRS = [
  attrs.PRICE,
  attrs.PRICE_CHANGE_RATE,
  attrs.DAY_PRICE_CHANGE_RATE,
  attrs.PREVIOUS_PRICE,
  attrs.PREVIOUS_DAY_PRICE,
  attrs.PREVIOUS_TIME,
  attrs.UPDATED_DATE,
]
const CHANGE_RATE_PROJECTED_ATTRS = [
  attrs.PRICE,
  attrs.UPDATED_DATE,
  attrs.PRICE_LIST,
  attrs.PRICE_TIMESTAMP_LIST,
]

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
}, CHANGE_RATE_PROJECTED_ATTRS)
const recordsByCompanyGSI = createInclusiveGSI({
  IndexName: indexNames.RECORDS_BY_COMPANY,
  KeySchema: [{ AttributeName: attrs.COMPANY, KeyType: 'HASH' }],
}, RECORD_PROJECTED_ATTRS)
const recordsByRiskLevelGSI = createInclusiveGSI({
  IndexName: indexNames.RECORDS_BY_RISK_LEVEL,
  KeySchema: [{ AttributeName: attrs.RISK_LEVEL, KeyType: 'HASH' }],
}, RECORD_PROJECTED_ATTRS)

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

/**
 * Helper to get table params
 * @param TableName
 * @param isActive Default to true
 */
const getTableParams = (
  TableName: string,
  isActive: boolean = true
): DynamoDB.CreateTableInput => ({
  TableName,
  KeySchema,
  AttributeDefinitions,
  // Every created table are regarded as a table containing the latest timeSK series data,
  // So assign the best capacity units.
  ProvisionedThroughput: isActive ? tableThroughput.ACTIVE : tableThroughput.INACTIVE,
  GlobalSecondaryIndexes,
  // Add stream for aggregation of top-level items
  StreamSpecification: {
    StreamEnabled: isActive,
    StreamViewType: isActive ? 'NEW_AND_OLD_IMAGES' : undefined,
  },
})

export default getTableParams