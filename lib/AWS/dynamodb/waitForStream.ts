import AWS from 'lib/AWS/AWS'
import waitForService from 'lib/helpers/waitForService';


// Initialize
const dynamodbStreams = new AWS.DynamoDBStreams();

type I = AWS.DynamoDBStreams.DescribeStreamInput
type O = AWS.DynamoDBStreams.DescribeStreamOutput
export type Result = O

const waitForStream = (input: I): Promise<null | Result> => new Promise((resolve, reject) => {
    return waitForService<I, O, AWS.AWSError>(dynamodbStreams.describeStream, input, data => !!data?.StreamDescription)
})

export default waitForStream