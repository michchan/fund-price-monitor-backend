import { DynamoDB } from 'aws-sdk'

// Minimum of 2 is required for the table aggregation IO processes
const ACTIVE: DynamoDB.ProvisionedThroughput = {
  ReadCapacityUnits: 2,
  WriteCapacityUnits: 2,
}
const INACTIVE: DynamoDB.ProvisionedThroughput = {
  ReadCapacityUnits: 1,
  WriteCapacityUnits: 1,
}

const tableThroughput = {
  ACTIVE,
  INACTIVE,
} as const

export default tableThroughput