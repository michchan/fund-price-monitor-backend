import { CloudWatchLogsDecodedData, CloudWatchLogsHandler } from "aws-lambda"
import decodeCloudWatchLogEventPayload from "simply-utils/dist/AWS/decodeCloudWatchLogEventPayload"

import AWS from 'src/lib/AWS'


const sns = new AWS.SNS()

/**
 * Notify cloudwatch log error through channels like email, messages etc.
 * 
 * Reference: https://aws.amazon.com/blogs/mt/get-notified-specific-lambda-function-error-patterns-using-cloudwatch/
 */
export const handler: CloudWatchLogsHandler = async (event, context, callback) => {
    try {
        const payload = decodeCloudWatchLogEventPayload(event)
        console.log('Payload: ', JSON.stringify(payload, null, 2))

        // * Environment variable SNS_ARN is required
        const snsArn = process.env.SNS_ARN as string
        await publishMessage(payload, snsArn)
    } catch (error) {
        callback(error)
    }
}

/** Publish error message to SNS topic */
const publishMessage = async (payload: CloudWatchLogsDecodedData, TargetArn: string) => {
    const resourceType = payload.logGroup.split('/')[1].toUpperCase()
    const resourceName = payload.logGroup.split('/').pop()

    const message = 
        `\n${resourceType} Error Summary\n\n`
        + `------------------------------------------------------\n\n`
        + `# LogGroup name: ${payload.logGroup}\n`
        + `# LogStream: ${payload.logStream}\n`
        + `# LogMessage: \n\n${payload.logEvents.map(e => e.message).join('').split('\n')}\n\n`
        + `------------------------------------------------------`

    return sns.publish({
        TargetArn, 
        Subject: `Error for ${resourceType} - ${resourceName}`,
        Message: message,
    }).promise()
}