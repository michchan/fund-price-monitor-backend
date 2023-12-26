import AWS from 'src/lib/AWS'
import waitForAWSService from 'simply-utils/AWS/waitForAWSService'

// Initialize
const dynamodbStreams = new AWS.DynamoDBStreams()

type I = AWS.DynamoDBStreams.DescribeStreamInput
type O = AWS.DynamoDBStreams.DescribeStreamOutput
export type Output = O

const waitForStream = (input: I): Promise<null | Output> => waitForAWSService<I, O, AWS.AWSError>(
  // Prevent `this` context problem
  (...args) => dynamodbStreams.describeStream(...args),
  input,
  data => !!data?.StreamDescription
)

export default waitForStream