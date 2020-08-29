import AWS from 'lib/AWS'


// Initialize
const dynamodbStreams = new AWS.DynamoDBStreams();

const MAX_TRY_TIME = 25 // 25 times
const INTERVAL = 20000 // every 20 seconds

export type Result = AWS.DynamoDBStreams.DescribeStreamOutput

const waitForStream = (
    input: AWS.DynamoDBStreams.DescribeStreamInput,
    retryCounter: number = 0,
    callback?: (err: null | AWS.AWSError, result?: Result) => unknown,
): Promise<null | Result> => new Promise((resolve, reject) => {
    const handleErr = (err: null | AWS.AWSError) => {
        if (callback) callback(err)
        reject(new Error(`Unable to describe stream. Error JSON: ${err}`));
    }
    const handleResult = (data: Result) => {
        if (callback) callback(null, data);
        resolve(data);
    }

    dynamodbStreams.describeStream(input, (err, data) => {
        if (err || !data?.StreamDescription) {
            // Abort if retry time reaches maximum
            if (retryCounter >= MAX_TRY_TIME) {
                if (err) {
                    handleErr(err);
                } else {
                    resolve(null);
                }
            } else {
                // Pass resolve as a callback and increment `retryCounter`
                setTimeout(() => {
                    waitForStream(input, retryCounter + 1, (err, data) => {
                        if (err || !data?.StreamDescription) {
                            handleErr(err);
                        } else {
                            handleResult(data);
                        }
                    })
                }, INTERVAL)
            }
        } else {
            handleResult(data);
        }
    })
})

export default waitForStream