import AWS from 'src/lib/AWS'
import waitForAWSService from 'simply-utils/AWS/waitForAWSService'

// Initialize
const dynamodb = new AWS.DynamoDB()

type I = AWS.DynamoDB.DeleteTableInput
type O = AWS.DynamoDB.DescribeTableOutput

export type WaitForIndexMode = 'created' | 'deleted' | 'updated'
export type Output = O

const waitForGlobalSecondaryIndex = (
  input: I,
  indexName: string,
  mode: WaitForIndexMode = 'created',
): Promise<null | Output> => waitForAWSService<I, O, AWS.AWSError>(
  // Prevent `this` context problem
  (...args) => dynamodb.describeTable(...args),
  input,
  data => {
    const isActive = !!data?.Table?.GlobalSecondaryIndexes
      ?.some(c => c.IndexName === indexName && /^ACTIVE$/i.test(c.IndexStatus ?? ''))
    return mode === 'deleted'
      ? !isActive
      : isActive
  }
)

export default waitForGlobalSecondaryIndex