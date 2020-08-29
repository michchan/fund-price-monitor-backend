import AWS from 'lib/AWS'


// Initialize
const dynamodbStreams = new AWS.DynamoDBStreams();

const MAX_TRY_TIME = 25 // 25 times
const INTERVAL = 20000 // every 20 seconds

const waitForStream = (
    input: AWS.DynamoDBStreams.DescribeStreamInput,
    retryCounter: number = 0,
): Promise<AWS.DynamoDBStreams.DescribeStreamOutput> => new Promise((resolve, reject) => {
    dynamodbStreams.describeStream(input, (err, data) => {
        if (err || !data?.StreamDescription) {
            // Abort if retry time reaches maximum
            if (retryCounter >= MAX_TRY_TIME) {
                reject(new Error(`Unable to describe stream. Error JSON: ${err}`));
            } else {
                setTimeout(async () => resolve(
                    await waitForStream(input, retryCounter + 1)
                ), INTERVAL)
            }
        } else {
            resolve(data) 
        }
    })
})

export default waitForStream