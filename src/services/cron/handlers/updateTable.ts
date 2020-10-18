import { ScheduledHandler } from "aws-lambda"
import { DynamoDB } from "aws-sdk"
import { Quarter } from "simply-utils/dist/dateTime/getQuarter"
import { ProvisionedThroughput } from "aws-sdk/clients/dynamodb"

import TableRange from "src/models/fundPriceRecord/TableRange.type"
import AWS from 'src/lib/AWS'
import getTableName from "src/models/fundPriceRecord/utils/getTableName"
import describeTable, { Result as DescribeTableResult } from "src/models/fundPriceRecord/io/describeTable"
import updateTable from "src/models/fundPriceRecord/io/updateTable"
import checkTableExistence from "../helpers/checkTableExistence"
import getCurrentYearAndQuarter from "../../../helpers/getCurrentYearAndQuarter"



const lambda = new AWS.Lambda()

export type EventDetail = Partial<TableRange & {
  ProvisionedThroughput: Partial<DynamoDB.UpdateTableInput['ProvisionedThroughput']>
}> | undefined

/** 
 * Adjust the provisioned throughput of table for previous prevQuarter.
 * 
 * To run this function with customized prevQuarter, pass "prevYear" and "prevQuarter" in `event.detail` as an object. Specify `ProvisionedThroughput` to customize the throughput to update.
 * 
 */
export const handler: ScheduledHandler<EventDetail> = async (event, context, callback) => {
  try {
    const [currentYear, currentQuarter] = getCurrentYearAndQuarter()

    // Get passed params and assign default with PREVIOUS quarter
    const { 
      year: prevYear = currentQuarter === 1 ? currentYear - 1 : currentYear, 
      quarter: prevQuarter = currentQuarter === 1 ? 4 : currentQuarter - 1 as Quarter,
    } = event.detail ?? {}
    const {
      // Default to 1 for both RCU and WCU
      ReadCapacityUnits = 1,
      WriteCapacityUnits = 1,
    } = event.detail?.ProvisionedThroughput ?? {}

    // Get table name to update
    const prevQuarterTableName = getTableName(prevYear, prevQuarter)
    // Need to get the previous of previous table name coz the year and quarter of `checkTableExistence` is exclusive
    const exclusiveYear = prevQuarter === 1 ? +prevYear - 1 : prevYear
    const exclusiveQuarter = prevQuarter === 1 ? 4 : prevQuarter - 1 as Quarter
    // Check table existence
    const hasExistingPrevTable = await checkTableExistence(exclusiveYear, exclusiveQuarter, prevQuarterTableName)

    // Do update if the table exists
    if (hasExistingPrevTable) {
      const describeTableOutput = await deleteLambdaStreamEventSourceMapping(prevYear, prevQuarter)
      await updateTableThroughputsAndDisableStream(describeTableOutput, prevYear, prevQuarter, ReadCapacityUnits, WriteCapacityUnits)
    }
  } catch (error) {
    callback(error)
  }
}

const deleteLambdaStreamEventSourceMapping = async (year: number | string, quarter: Quarter) => {
  // Describe table and get the stream arn
  const describeTableOutput = await describeTable(year, quarter)
  // Get streaam ARN
  const streamArn = describeTableOutput.Table?.LatestStreamArn
  // Remove event source mapping for aggregation handler
  if (streamArn) {
    // Get the aggregator ARN Passed from the environment variables defined in CDK construct of cron,
    // to map as dynamodb stream target function
    const aggregationHandlerArn = process.env.AGGREGATION_HANDLER_ARN as string

    // List event source mapping
    const eventSourceMappings = await lambda.listEventSourceMappings({ 
      FunctionName: aggregationHandlerArn,
      EventSourceArn: streamArn,
    }).promise()

    // Delete all event source mappings found related to this table
    await Promise.all(
      (eventSourceMappings.EventSourceMappings ?? []).map(mapping => {
        if (!mapping.UUID) return
        return lambda.deleteEventSourceMapping({
          UUID: mapping.UUID
        }).promise()
      })
    )
  }
  return describeTableOutput
}

const updateTableThroughputsAndDisableStream = async (
  describeTableOutput: DescribeTableResult,
  prevYear: string | number,
  prevQuarter: Quarter,
  ReadCapacityUnits: ProvisionedThroughput['ReadCapacityUnits'],
  WriteCapacityUnits: ProvisionedThroughput['WriteCapacityUnits'],
) => {
  const throughput = describeTableOutput?.Table?.ProvisionedThroughput
  const streamEnabled = describeTableOutput.Table?.StreamSpecification?.StreamEnabled

  // * The following update-table requests must be separate,
  // * since AWS DynamoDB only allow update either one per request.

  // Update only when some of the throughput changed
  // Since AWS don't allow an "unchanged update".
  if (
    throughput?.ReadCapacityUnits !== ReadCapacityUnits 
    || throughput?.WriteCapacityUnits !== WriteCapacityUnits
  ) {
    // Send update table request
    await updateTable(prevYear, prevQuarter, {
      // Update the throughput of the table
      ProvisionedThroughput: {
        ReadCapacityUnits,
        WriteCapacityUnits,
      },
    // Wait for the service to be updated complete, 
    // if there is another update, i.e. disabling table's stream
    }, streamEnabled)
  }
  // Disable stream if it is enabled
  if (streamEnabled) {
    // Disable table stream, AWS requires the update to be separate:
    // "You cannot modify stream status while updating table IOPS"
    await updateTable(prevYear, prevQuarter, {
      // Disable stream
      StreamSpecification: { StreamEnabled: false }
    })
  }
}