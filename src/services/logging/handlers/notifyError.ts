import { CloudWatchLogsHandler } from "aws-lambda";

/**
 * Notify cloudwatch log error through channels like email, messages etc.
 */
export const handler: CloudWatchLogsHandler = async (event, context, callback) => {
    try {
        console.log('EVENT', JSON.stringify(event, null, 2));
        console.log('CONTEXT', JSON.stringify(context, null, 2));
    } catch (error) {
        callback(error)
    }
}