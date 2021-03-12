import AWS from 'src/lib/AWS'
import waitForAWSService from 'simply-utils/dist/AWS/waitForAWSService'

// Initialize
const dynamodb = new AWS.DynamoDB()

type I = AWS.DynamoDB.DeleteTableInput
type O = AWS.DynamoDB.DescribeTableOutput

export type WaitForIndexMode = 'exist' | 'notExist' | 'updated'
export type Output = O

const waitForGlobalSecondaryIndex = (
  input: I,
  indexName: string,
  mode: WaitForIndexMode = 'exist',
): Promise<null | Output> => waitForAWSService<I, O, AWS.AWSError>(
  // Prevent `this` context problem
  (...args) => dynamodb.describeTable(...args),
  input,
  data => {
    if (mode === 'updated') {
      return !!data?.Table?.GlobalSecondaryIndexes
        ?.some(c => c.IndexName === indexName && /^ACTIVE$/i.test(c.IndexStatus ?? ''))
    }
    const isExist = !!data?.Table?.GlobalSecondaryIndexes?.some(c => c.IndexName === indexName)
    return mode === 'exist'
      ? isExist
      : !isExist
  }
)

export default waitForGlobalSecondaryIndex