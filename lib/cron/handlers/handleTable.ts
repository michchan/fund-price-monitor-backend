import { ScheduledHandler } from "aws-lambda";
import getQuarter from "simply-utils/dist/dateTime/getQuarter";

import fundPriceRecord from "lib/models/fundPriceRecord";



/** 
 * Check table existence and create table
 */
export const handler: ScheduledHandler = async (event, context, callback) => {
    try {
        // Get current year and quarter
        const year = new Date().getFullYear()
        const quarter = getQuarter()
        // List tables upon the current quarter
        const tableNames = await fundPriceRecord.listLatestTables();
        // Create a table of the current quarter if it does NOT exist
        if (!tableNames.some(fundPriceRecord.isTableOfCurrentQuarter)) {
            // Get the aggregator ARN Passed from the environment variables defined in CDK construct of cron,
            // to map as dynamodb stream target function
            const aggregationHandlerArn = process.env.AGGREGATION_HANDLER_ARN as string
            // Create one if it doesn't exist
            await fundPriceRecord.createTable(year, quarter, aggregationHandlerArn);
        }
    } catch (error) {
        callback(error)
    }
}