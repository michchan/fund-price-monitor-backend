import { CloudWatchLogsDecodedData, CloudWatchLogsEvent, CloudWatchLogsHandler } from "aws-lambda"

/**
 * Notify cloudwatch log error through channels like email, messages etc.
 * 
 * Reference: https://aws.amazon.com/blogs/mt/get-notified-specific-lambda-function-error-patterns-using-cloudwatch/
 */
export const handler: CloudWatchLogsHandler = async (event, context, callback) => {
    try {
        const payload = decodePayload(event)
        console.log('PAYLOAD', JSON.stringify(payload, null, 2))
    } catch (error) {
        callback(error)
    }
}

/** Decode payload */
const decodePayload = (event: CloudWatchLogsEvent): CloudWatchLogsDecodedData => {
    return JSON.parse(atob(event.awslogs.data))
}