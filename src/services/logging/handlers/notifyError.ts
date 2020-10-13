import { CloudWatchLogsHandler } from "aws-lambda";

/**
 * Notify cloudwatch log error through channels like email, messages etc.
 * 
 * Reference: https://aws.amazon.com/blogs/mt/get-notified-specific-lambda-function-error-patterns-using-cloudwatch/
 */
export const handler: CloudWatchLogsHandler = async (event, context, callback) => {
    try {
        console.log('EVENT', JSON.stringify(event, null, 2));
        console.log('CONTEXT', JSON.stringify(context, null, 2));
    } catch (error) {
        callback(error)
    }
}