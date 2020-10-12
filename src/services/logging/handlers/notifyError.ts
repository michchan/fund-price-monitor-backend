import { CloudWatchLogsHandler } from "aws-lambda";

/**
 * Notify cloudwatch log error through channels like email, messages etc.
 */
export const handler: CloudWatchLogsHandler = async (event, context, callback) => {
    try {
        
    } catch (error) {
        callback(error)
    }
}