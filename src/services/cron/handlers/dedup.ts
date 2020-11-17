import { ScheduledHandler } from 'aws-lambda'
import mapValues from 'lodash/mapValues'
import pipeAsync from 'simply-utils/dist/async/pipeAsync'
import wait from 'simply-utils/dist/async/wait'

import getDateTimeDictionary from 'src/helpers/getDateTimeDictionary'
import logObj from 'src/helpers/logObj'
import forEachCompany from 'src/models/fundPriceRecord/utils/forEachCompany'
import beginsWith from 'src/lib/AWS/dynamodb/expressionFunctions/beginsWith'
import attrs from 'src/models/fundPriceRecord/constants/attributeNames'
import FundPriceRecord, { CompanyType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import batchDelete from 'src/models/fundPriceRecord/io/batchDelete'
import queryItemsByCompany, { Input as QueryItemsInput } from 'src/models/fundPriceRecord/io/queryItemsByCompany'
import TableRange from 'src/models/fundPriceRecord/TableRange.type'
import getCompositeSK from 'src/models/fundPriceRecord/utils/getCompositeSK'
import getCompositeSKFromChangeRate from 'src/models/fundPriceRecord/utils/getCompositeSKFromChangeRate'
import isDuplicated from 'src/models/fundPriceRecord/utils/isDuplicated'
import parseRecord from 'src/models/fundPriceRecord/utils/parseRecord'
import parseChangeRate from 'src/models/fundPriceRecord/utils/parseChangeRate'
import FundPriceChangeRate from 'src/models/fundPriceRecord/FundPriceChangeRate.type'

const EXP_TIME_SK_PREFIX = ':timeSK' as string

type FRec = FundPriceRecord
type FCRate = FundPriceChangeRate

interface ItemsDict {
  record: FRec[];
  latest: FRec[];
  week: FCRate[];
  month: FCRate[];
  quarter: FCRate[];
}
const getItems = async (company: CompanyType, tableRange: TableRange): Promise<ItemsDict> => {
  const commonInput = {
    shouldQueryAll: true,
    at: tableRange,
  }
  const getInputMerger = (timeSKPrefix: string) => (defaultInput: QueryItemsInput) => ({
    ...defaultInput,
    ExpressionAttributeValues: {
      ...defaultInput.ExpressionAttributeValues,
      [EXP_TIME_SK_PREFIX]: timeSKPrefix,
    },
    FilterExpression: [
      `(${defaultInput.FilterExpression ?? ''})`,
      beginsWith(attrs.TIME_SK, EXP_TIME_SK_PREFIX),
    ].join(' AND '),
  })

  const { parsedItems: recordItems } = await queryItemsByCompany(company, {
    ...commonInput,
    parser: parseRecord,
  })
  const { parsedItems: latestItems } = await queryItemsByCompany(company, {
    ...commonInput,
    shouldQueryLatest: true,
    parser: parseRecord,
  })
  const { parsedItems: weekRates } = await queryItemsByCompany(company, {
    ...commonInput,
    input: getInputMerger('week'),
    parser: parseChangeRate,
  })
  const { parsedItems: monthRates } = await queryItemsByCompany(company, {
    ...commonInput,
    input: getInputMerger('month'),
    parser: parseChangeRate,
  })
  const { parsedItems: quarterRates } = await queryItemsByCompany(company, {
    ...commonInput,
    input: getInputMerger('quarter'),
    parser: parseChangeRate,
  })

  return {
    record: recordItems,
    latest: latestItems,
    week: weekRates,
    month: monthRates,
    quarter: quarterRates,
  }
}

const getDupedRecords = <T extends FRec | FCRate> (records: T[]): T[] => {
  const uniqItems: T[] = []
  return records.reduce((acc: T[], record: T) => {
    const hasSameItem = uniqItems.some(uniqRec => isDuplicated(record, uniqRec))
    if (hasSameItem) return [...acc, record]
    uniqItems.push(record)
    return acc
  }, [])
}

type TRecs = FRec[] | FCRate[]
type ObjIteratee = (records: ItemsDict[keyof ItemsDict]) => typeof records
const getAllDuped = (itemsDict: ItemsDict) => mapValues<ItemsDict, TRecs>(
  itemsDict,
  getDupedRecords as ObjIteratee
)

type ItemEntry = [string, ItemsDict[keyof ItemsDict]]
const REQUEST_DELAY = 1000
const getBatchRequestSender = (tableRange: TableRange) => (
  [key, records]: ItemEntry,
  i: number,
  arr: ItemEntry[],
) => async () => {
  const k = key as keyof ItemsDict
  type RArgs = [TableRange, typeof getCompositeSK]
  type CArgs = [TableRange, typeof getCompositeSKFromChangeRate]

  const { year, quarter } = tableRange
  const isRecord = k === 'latest' || k === 'record'
  const getTimeSK = isRecord
    ? getCompositeSK
    : getCompositeSKFromChangeRate

  const recordArgs = [{ year, quarter }, getTimeSK] as RArgs
  const changeRateArgs = [{ year, quarter }, getTimeSK] as CArgs

  if (records.length === 0) return

  if (isRecord) await batchDelete(records as FRec[], ...recordArgs)
  else await batchDelete(records as FCRate[], ...changeRateArgs)

  if (i < arr.length - 1) await wait(REQUEST_DELAY)
}

const manipulateEachCompany = async (company: CompanyType, tableRange: TableRange) => {
  const itemsDict = await getItems(company, tableRange)
  const dupedItemsDict = getAllDuped(itemsDict)
  logObj(`Duplicates found for ${company}:`, mapValues(dupedItemsDict, val => val.length))

  const batchReqSenders = Object
    .entries(dupedItemsDict)
    .map(getBatchRequestSender(tableRange))

  await pipeAsync(...batchReqSenders)()
}

/**
 * De-duplications of records
 */
export const handler: ScheduledHandler = async () => {
  const date = new Date()
  const { year, quarter } = getDateTimeDictionary(date)
  await forEachCompany(company => manipulateEachCompany(company, { year, quarter }))
}