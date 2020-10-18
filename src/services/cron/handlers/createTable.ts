import { ScheduledHandler } from "aws-lambda"
import { Quarter } from "simply-utils/dist/dateTime/getQuarter"

import TableRange from "src/models/fundPriceRecord/TableRange.type"
import createTable from "src/models/fundPriceRecord/io/createTable"
import createTableDetails from "src/models/fundPriceRecord/io/createTableDetails"
import checkTableExistence from "../helpers/checkTableExistence"
import getCurrentYearAndQuarter from "../../../helpers/getCurrentYearAndQuarter"



export type EventDetail = TableRange | undefined

/** 
 * Create table for next coming quarter.
 * 
 * To run this function with customized quarter, pass "year" and "quarter" in `event.detail` as an object.
 */
export const handler: ScheduledHandler<EventDetail> = async (event, context, callback) => {
  try {
    const [currentYear, currentQuarter] = getCurrentYearAndQuarter()

    // Get passed params and assign default with NEXT quarter
    const { 
      year = currentQuarter === 4 ? currentYear + 1 : currentYear, 
      quarter = currentQuarter === 4 ? 1 : currentQuarter + 1 as Quarter
    } = event.detail ?? {}

    const hasExistingTable = await checkTableExistence(year, quarter)
    // Create a table of the specified quarter if it does NOT exist
    if (!hasExistingTable) {
      // Get the aggregator ARN Passed from the environment variables defined in CDK construct of cron,
      // to map as dynamodb stream target function
      const aggregationHandlerArn = process.env.AGGREGATION_HANDLER_ARN as string
      // Create one if it doesn't exist
      await createTable(year, quarter, aggregationHandlerArn)
      // Create table detail row
      await createTableDetails({
        time: new Date().toISOString(),
        companies: [],
        fundTypes: [],
      }, year, quarter)
    }
  } catch (error) {
    callback(error)
  }
}