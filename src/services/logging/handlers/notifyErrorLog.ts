import { CloudWatchLogsDecodedData, CloudWatchLogsHandler } from 'aws-lambda'
import decodeCloudWatchLogEventPayload from 'simply-utils/dist/AWS/decodeCloudWatchLogEventPayload'
import capitalizeWords from 'simply-utils/dist/string/capitalizeWords'
import getEnvVar from 'simply-utils/dist/utils/getEnvVar'
import logObj from 'src/helpers/logObj'

import AWS from 'src/lib/AWS'
import env from 'src/lib/env'

const { values: { AWS_RUNTIME_REGION } } = env

// * Environment variable SNS_TOPIC_ARN is required
const snsArn = getEnvVar('SNS_TOPIC_ARN')

const sns = new AWS.SNS()

/** Publish error message to SNS topic */
const publishMessage = (payload: CloudWatchLogsDecodedData, TargetArn: string) => {
  const { logGroup, logStream, logEvents } = payload
  const resourceType = capitalizeWords(logGroup.split('/')[2])
  const resourceName = logGroup.split('/').pop()
  const messages = logEvents.map(e => e.message).join('\n')

  const logStreamUrl = `https://${AWS_RUNTIME_REGION}.console.aws.amazon.com/cloudwatch/home?region=${AWS_RUNTIME_REGION}#logsV2:log-groups/log-group/${encodeURIComponent(logGroup)}/log-events/${encodeURIComponent(logStream)}`

  const message = `\n${resourceType} Error Summary\n\n`
    + '------------------------------------------------------\n\n'
    + `# LogGroup name: ${payload.logGroup}\n`
    + `# LogStream: ${payload.logStream}\n`
    + `# Log URL: ${logStreamUrl}\n`
    + `# LogMessage: \n\n${messages}\n\n`
    + '------------------------------------------------------'

  return sns.publish({
    TargetArn,
    Subject: `Error from ${resourceType} - ${resourceName}`,
    Message: message,
  }).promise()
}

/**
 * Notify cloudwatch log error through channels like email, messages etc.
 *
 * Reference: https://aws.amazon.com/blogs/mt/get-notified-specific-lambda-function-error-patterns-using-cloudwatch/
 */
export const handler: CloudWatchLogsHandler = async event => {
  const payload = decodeCloudWatchLogEventPayload(event)
  logObj('Payload: ', payload)

  // Must await the service
  await publishMessage(payload, snsArn)
}