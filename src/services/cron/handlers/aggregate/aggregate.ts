import { DynamoDBStreamHandler } from 'aws-lambda'
import {
  FundPriceRecord,
  FundPriceChangeRate,
  CompanyType,
  FundType,
  RecordType,
} from '@michchan/fund-price-monitor-lib'
import getEnvVar from 'simply-utils/dist/utils/getEnvVar'

import getDateTimeDictionary from 'src/helpers/getDateTimeDictionary'
import logObj from 'src/helpers/logObj'
import groupEventRecordsByCompany from './groupEventRecordsByCompany'
import updateTableLevelDetails from './updateTableLevelDetails'
import queryPrevItems from './queryPrevItems'
import deriveAggregatedItems from './deriveAggregatedItems'
import createItems from './createItems'
import deleteItems from './deleteItems'

const isTest = /^true$/i.test(getEnvVar('IS_TEST', false))

/**
 * Handler to process each group of FundPriceRecord list
 */
const processCompanyRecords = async (
  company: CompanyType,
  insertedItems: FundPriceRecord<FundType, RecordType.record>[],
  date: Date,
) => {
  if (isTest) logObj('processCompanyRecords.insertedItems:', insertedItems)

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
  await createItems(dateTimeDict, isTest, ...aggregatedOutputs)
  await deleteItems(dateTimeDict, isTest, ...prevOutputs)
}

export const handler: DynamoDBStreamHandler = async event => {
  if (isTest) logObj('aggregate.event:', event)

  // Create date of latest item
  const date = new Date()
  const { year, quarter } = getDateTimeDictionary(date)

  const [groups, records] = groupEventRecordsByCompany(event)
  // Abort if there is no items to process
  if (records.length === 0) return

  // Process records by company
  for (const [company, items] of Object.entries(groups))
    await processCompanyRecords(company as CompanyType, items, date)

  await updateTableLevelDetails(groups, records, year, quarter, isTest)
}