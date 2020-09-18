import { ScheduledHandler } from "aws-lambda";
import getQuarter, { Quarter } from "simply-utils/dist/dateTime/getQuarter";

import TableRange from "src/models/fundPriceRecord/TableRange.type";
import getTableName from "src/models/fundPriceRecord/utils/getTableName";
import listLatestTables from "src/models/fundPriceRecord/io/listLatestTables";
import createTable from "src/models/fundPriceRecord/io/createTable";
import createTableDetails from "src/models/fundPriceRecord/io/createTableDetails";



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
        const tableName = getTableName(year, quarter);
        
        // Check table existence
        const tableNames = await listLatestTables({ year, quarter });
        // Create a table of the specified quarter if it does NOT exist
        if (!tableNames.some(name => name === tableName)) {
            // Get the aggregator ARN Passed from the environment variables defined in CDK construct of cron,
            // to map as dynamodb stream target function
            const aggregationHandlerArn = process.env.AGGREGATION_HANDLER_ARN as string
            // Create one if it doesn't exist
            await createTable(year, quarter, aggregationHandlerArn);
            // Create table detail row
            await createTableDetails({
                time: date.toISOString(),
                companies: [],
                fundTypes: [],
            }, year, quarter);
        }
    } catch (error) {
        callback(error)
    }
}