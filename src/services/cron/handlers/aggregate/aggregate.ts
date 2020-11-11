import { DynamoDBStreamHandler } from 'aws-lambda'

import FundPriceRecord, {
  CompanyType,
  FundType,
} from 'src/models/fundPriceRecord/FundPriceRecord.type'
import getDateTimeDictionary from 'src/helpers/getDateTimeDictionary'
import groupEventRecordsByCompany from './groupEventRecordsByCompany'
import updateTableLevelDetails from './updateTableLevelDetails'
import queryPrevItems from './queryPrevItems'
import deriveAggregatedItems from './deriveAggregatedItems'
import createItems from './createItems'
import deleteItems from './deleteItems'
import AWS from 'src/lib/AWS'
import FundPriceChangeRate from 'src/models/fundPriceRecord/FundPriceChangeRate.type'

const stepfunctions = new AWS.StepFunctions()
const executePostStepFunctions = (stateMachineArn: string) => stepfunctions.startExecution({
  stateMachineArn,
}).promise()

/**
 * Handler to process each group of FundPriceRecord list
 */
const processCompanyRecords = async (
  company: CompanyType,
  insertedItems: FundPriceRecord<FundType, 'record'>[],
  date: Date,
) => {
  // Get year and quarter
  const dateTimeDict = getDateTimeDictionary(date)

  /** // ! IMPORTANT: All the records retrieved process must be filtered by `insertedItems` */
  function matchInserted (rec: FundPriceRecord | FundPriceChangeRate) {
    return insertedItems.some(inserted => inserted.code === rec.code)
  }

  // Fetch previous recrods for price change rate of week, month and quarter
  const prevOutputs = await queryPrevItems(company, matchInserted, date)
  // Calculate records of price change rate of week, month and quarter
  const aggregatedOutputs = deriveAggregatedItems(insertedItems, date, ...prevOutputs)

  /** -------- Send batch requests -------- */
  await createItems(dateTimeDict, ...aggregatedOutputs)
  await deleteItems(dateTimeDict, ...prevOutputs)
}

export const handler: DynamoDBStreamHandler = async event => {
  // Get the state machine ARN Passed from
  // The environment variables defined in CDK construct of cron,
  const postAggregateStateMachineArn = process.env.POST_AGGREGATE_STATE_MACHINE_ARN as string
  if (!postAggregateStateMachineArn)
    throw new Error('Environment variable POST_AGGREGATE_STATE_MACHINE_ARN undefined')

  // Create date of latest item
  const date = new Date()
  const { year, quarter } = getDateTimeDictionary(date)

  const [groups, records] = groupEventRecordsByCompany(event)
  // Abort if there is no items to process
  if (records.length === 0) return

  // Process records by company
  for (const [company, items] of Object.entries(groups))
    await processCompanyRecords(company as CompanyType, items, date)

  await updateTableLevelDetails(groups, records, year, quarter)

  /** -------- Trigger state machine -------- */
  await executePostStepFunctions(postAggregateStateMachineArn)
}