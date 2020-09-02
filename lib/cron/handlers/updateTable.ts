import { ScheduledHandler } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import getQuarter, { Quarter } from "simply-utils/dist/dateTime/getQuarter";

import TableRange from "lib/models/fundPriceRecord/TableRange.type";
import fundPriceRecord from "lib/models/fundPriceRecord";
import AWS from 'lib/AWS/AWS'



const lambda = new AWS.Lambda();

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
            /** ------------------ Delete stream-lambda event source mapping ------------------ */
        
            // Describe table and get the stream arn
            const describeTableOutput = await fundPriceRecord.describeTable(year, quarter);
            // Get streaam ARN
            const streamArn = describeTableOutput.Table?.LatestStreamArn
            // Remove event source mapping for aggregation handler
            if (streamArn) {
                // Get the aggregator ARN Passed from the environment variables defined in CDK construct of cron,
                // to map as dynamodb stream target function
                const aggregationHandlerArn = process.env.AGGREGATION_HANDLER_ARN as string;

                // List event source mapping
                const eventSourceMappings = await lambda.listEventSourceMappings({ 
                    FunctionName: aggregationHandlerArn,
                    EventSourceArn: streamArn,
                }).promise();
                // Delete all event source mappings found related to this table
                await Promise.all(
                    (eventSourceMappings.EventSourceMappings ?? []).map(mapping => {
                        if (!mapping.UUID) return
                        return lambda.deleteEventSourceMapping({
                            UUID: mapping.UUID
                        }).promise();
                    })
                );
            }

            /** ------------------ Update table throughput configs ------------------ */

            // Send update table request
            await fundPriceRecord.updateTable(year, quarter, {
                // Update the throughput of the table
                ProvisionedThroughput: {
                    ReadCapacityUnits,
                    WriteCapacityUnits,
                },
                // Disable stream for that table
                StreamSpecification: {
                    StreamEnabled: false
                },
            });
        }
    } catch (error) {
        callback(error)
    }
}