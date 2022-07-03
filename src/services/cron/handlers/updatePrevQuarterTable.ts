import { DynamoDB } from 'aws-sdk'
import { ScheduledHandler } from 'aws-lambda'
import { Quarter } from 'simply-utils/dist/dateTime/getQuarter'
import getQuarterOffset from 'simply-utils/dist/dateTime/getQuarterOffset'
import getEnvVar from 'simply-utils/dist/utils/getEnvVar'

import AWS from 'src/lib/AWS'
import checkTableExistence from 'src/models/fundPriceRecord/io/checkTableExistence'
import describeTable, {
  Output as DescribeTableResult,
} from 'src/models/fundPriceRecord/io/describeTable'
import getCurrentYearAndQuarter from 'src/helpers/getCurrentYearAndQuarter'
import TableRange from 'src/models/fundPriceRecord/TableRange.type'
import updateTable from 'src/models/fundPriceRecord/io/updateTable'

const BILLING_MODE_PAY_PER_REQUEST = 'PAY_PER_REQUEST'

/* Get the aggregator ARN Passed from the environment variables
   defined in CDK construct of cron,
   To map as dynamodb stream target function */
const aggregationHandlerArn = getEnvVar('AGGREGATION_HANDLER_ARN')

const lambda = new AWS.Lambda()

const deleteLambdaStreamEventSourceMapping = async (year: number | string, quarter: Quarter) => {
  // Describe table and get the stream arn
  const describeTableOutput = await describeTable(year, quarter)
  // Get streaam ARN
  const streamArn = describeTableOutput.Table?.LatestStreamArn
  // Remove event source mapping for aggregation handler
  if (streamArn) {
    // List event source mapping
    const eventSourceMappings = await lambda.listEventSourceMappings({
      FunctionName: aggregationHandlerArn,
      EventSourceArn: streamArn,
    }).promise()

    // Delete all event source mappings found related to this table
    await Promise.all(
      (eventSourceMappings.EventSourceMappings ?? []).map(mapping => {
        if (!mapping.UUID) return new Promise(resolve => { resolve(null) })
        return lambda.deleteEventSourceMapping({ UUID: mapping.UUID }).promise()
      })
    )
  }
  return describeTableOutput
}

const updateTableConfig = async (
  describeTableOutput: DescribeTableResult,
  year: string | number,
  quarter: Quarter,
) => {
  const billingMode = describeTableOutput?.Table?.BillingModeSummary?.BillingMode
  const isStreamEnabled = describeTableOutput.Table?.StreamSpecification?.StreamEnabled

  // * The following update-table requests must be separate,
  // * Since AWS DynamoDB only allow update either one per request.

  // Update only when the mode is different
  // Since AWS don't allow an "unchanged update".
  if (billingMode !== BILLING_MODE_PAY_PER_REQUEST) {
    // Send update table request
    await updateTable(year, quarter, {
      // Update billing mode to 'on-demand'
      BillingMode: BILLING_MODE_PAY_PER_REQUEST,
    // Wait for the service to be updated complete,
    // If there is another update, i.e. disabling table's stream
    }, isStreamEnabled)
  }
  // Disable stream if it is enabled
  if (isStreamEnabled) {
    // Disable table stream, AWS requires the update to be separate:
    // "You cannot modify stream status while updating table IOPS"
    await updateTable(year, quarter, {
      // Disable stream
      StreamSpecification: { StreamEnabled: false },
    })
  }
}

export type EventDetail = Partial<TableRange & {
  ProvisionedThroughput: Partial<DynamoDB.UpdateTableInput['ProvisionedThroughput']>;
}> | undefined

/**
 * Adjust the provisioned throughput of table for previous quarter.
 *
 * To run this function with customized quarter,
 * pass "year" and "quarter" in `event.detail` as an object.
 * Specify `ProvisionedThroughput` to customize the throughput to update.
 */
export const handler: ScheduledHandler<EventDetail> = async event => {
  const [currentYear, currentQuarter] = getCurrentYearAndQuarter()
  const [prevYear, prevQuarter] = getQuarterOffset(currentYear, currentQuarter, -1)

  // Get passed params and assign default with PREVIOUS quarter
  const {
    year = prevYear,
    quarter = prevQuarter,
  } = event.detail ?? {}

  // Check table existence of previous quarter
  const hasExistingPrevTable = await checkTableExistence(year, quarter)

  // Do update if the table exists
  if (hasExistingPrevTable) {
    const describeTableOutput = await deleteLambdaStreamEventSourceMapping(year, quarter)
    await updateTableConfig(describeTableOutput, year, quarter)
  }
}