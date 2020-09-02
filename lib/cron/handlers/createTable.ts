import { ScheduledHandler } from "aws-lambda";
import getQuarter, { Quarter } from "simply-utils/dist/dateTime/getQuarter";

import fundPriceRecord from "lib/models/fundPriceRecord";
import TableRange from "lib/models/fundPriceRecord/TableRange.type";



export type EventDetail = TableRange | undefined

/** 
 * Create table for next coming quarter.
 * 
 * To run this function with customized quarter, pass "year" and "quarter" in `event.detail` as an object.
 */
export const handler: ScheduledHandler<EventDetail> = async (event, context, callback) => {
    try {
        // Get current year and quarter
        const date = new Date();
        const currentYear = date.getFullYear();
        const currentQuarter = getQuarter(date);

        // Get passed params and assign default with NEXT quarter
        const { 
            year = currentQuarter === 4 ? currentYear + 1 : currentYear, 
            quarter = currentQuarter === 4 ? 1 : currentQuarter + 1 as Quarter
        } = event.detail ?? {}

        // Get table name to create
        const tableName = fundPriceRecord.getTableName(year, quarter);
        
        // Check table existence
        const tableNames = await fundPriceRecord.listLatestTables({ year, quarter });
        // Create a table of the specified quarter if it does NOT exist
        if (!tableNames.some(name => name === tableName)) {
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