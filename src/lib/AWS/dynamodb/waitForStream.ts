import AWS from 'src/lib/AWS'
import waitForService from 'src/helpers/waitForService';


// Initialize
const dynamodbStreams = new AWS.DynamoDBStreams();

type I = AWS.DynamoDBStreams.DescribeStreamInput
type O = AWS.DynamoDBStreams.DescribeStreamOutput
export type Result = O

const waitForStream = (input: I): Promise<null | Result> => waitForService<I, O, AWS.AWSError>(
    // Prevent `this` context problem
    (...args) => dynamodbStreams.describeStream(...args), 
    input, 
    data => !!data?.StreamDescription
)

export default waitForStream