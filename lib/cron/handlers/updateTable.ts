import { ScheduledHandler } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import getQuarter, { Quarter } from "simply-utils/dist/dateTime/getQuarter";

import TableRange from "lib/models/fundPriceRecord/TableRange.type";
import fundPriceRecord from "lib/models/fundPriceRecord";


export type EventDetail = Partial<TableRange & {
    ProvisionedThroughput: Partial<DynamoDB.UpdateTableInput['ProvisionedThroughput']>;
}> | undefined

/** 
 * Adjust the provisioned throughput of table for previous quarter.
 * 
 * To run this function with customized quarter, pass "year" and "quarter" in `event.detail` as an object. Specify `ProvisionedThroughput` to customize the throughput to update.
 * 
 */
export const handler: ScheduledHandler<EventDetail> = async (event, context, callback) => {
    try {
        // Get current year and quarter
        const date = new Date();
        const currentYear = date.getFullYear();
        const currentQuarter = getQuarter(date);

        // Get passed params and assign default with PREVIOUS quarter
        const { 
            year = currentQuarter === 1 ? currentYear - 1 : currentYear, 
            quarter = currentQuarter === 1 ? 4 : currentQuarter - 1 as Quarter,
        } = event.detail ?? {}
        const {
            // Default to 1 for both RCU and WCU
            ReadCapacityUnits = 1,
            WriteCapacityUnits = 1,
        } = event.detail?.ProvisionedThroughput ?? {}

        // Get table name to update
        const tableName = fundPriceRecord.getTableName(year, quarter);

        // Check table existence
        const tableNames = await fundPriceRecord.listLatestTables({ year, quarter });
        // Do update if the table exists
        if (tableNames.some(name => name === tableName)) {
            // Send update table request
            await fundPriceRecord.updateTable(year, quarter, {
                // Update the throughput of the table
                ProvisionedThroughput: {
                    ReadCapacityUnits,
                    WriteCapacityUnits,
                }
            })
        }
    } catch (error) {
        callback(error)
    }
}