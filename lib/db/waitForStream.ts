import AWS from 'lib/AWS'


// Initialize
const dynamodbStreams = new AWS.DynamoDBStreams();

const MAX_TRY_TIME = 25 // 25 times
const INTERVAL = 20000 // every 20 seconds

export type Result = AWS.DynamoDBStreams.DescribeStreamOutput

const waitForStream = (
    input: AWS.DynamoDBStreams.DescribeStreamInput,
    retryCounter: number = 0,
    callback?: (result: Result) => unknown,
): Promise<null | Result> => new Promise((resolve, reject) => {
    dynamodbStreams.describeStream(input, (err, data) => {
        if (err || !data?.StreamDescription) {
            // Abort if retry time reaches maximum
            if (retryCounter >= MAX_TRY_TIME) {
                if (err) {
                    reject(new Error(`Unable to describe stream. Error JSON: ${err}`));
                } else {
                    resolve(null);
                }
            } else {
                // Pass resolve as a callback and increment `retryCounter`
                setTimeout(() => waitForStream(input, retryCounter + 1, resolve), INTERVAL)
            }
        } else {
            if (callback) callback(data)
            resolve(data) 
        }
    })
})

export default waitForStream