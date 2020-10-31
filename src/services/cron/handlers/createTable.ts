import { ScheduledHandler } from 'aws-lambda'
import { Quarter } from 'simply-utils/dist/dateTime/getQuarter'

import TableRange from 'src/models/fundPriceRecord/TableRange.type'
import createTable from 'src/models/fundPriceRecord/io/createTable'
import createTableDetails from 'src/models/fundPriceRecord/io/createTableDetails'
import checkTableExistence from '../helpers/checkTableExistence'
import getCurrentYearAndQuarter from '../../../helpers/getCurrentYearAndQuarter'
import getOffsetQuarter from 'src/helpers/getOffsetQuarter'

export type EventDetail = TableRange | undefined

const createTableAndDetails = async (year: number | string, quarter: Quarter) => {
  // Get the aggregator ARN Passed from the environment variables defined in CDK construct of cron,
  // To map as dynamodb stream target function
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

/**
 * Create table for next coming quarter.
 *
 * To run this function with customized quarter,
 * pass "year" and "quarter" in `event.detail` as an object.
 */
export const handler: ScheduledHandler<EventDetail> = async event => {
  const [currentYear, currentQuarter] = getCurrentYearAndQuarter()
  const [nextYear, nextQuarter] = getOffsetQuarter(currentYear, currentQuarter, 1)

  // Get passed params and assign default with NEXT quarter
  const {
    year = nextYear,
    quarter = nextQuarter,
  } = event.detail ?? {}

  const hasExistingTable = await checkTableExistence(year, quarter)
  // Create a table of the specified quarter if it does NOT exist
  if (!hasExistingTable) await createTableAndDetails(year, quarter)
}