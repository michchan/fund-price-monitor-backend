import { ScheduledHandler } from 'aws-lambda'
import mapValues from 'lodash/mapValues'
import pipeAsync from 'simply-utils/dist/async/pipeAsync'
import wait from 'simply-utils/dist/async/wait'
import { Quarter } from 'simply-utils/dist/dateTime/getQuarter'

import getDateTimeDictionary from 'src/helpers/getDateTimeDictionary'
import logObj from 'src/helpers/logObj'
import forEachCompany from 'src/models/fundPriceRecord/utils/forEachCompany'
import beginsWith from 'src/lib/AWS/dynamodb/expressionFunctions/beginsWith'
import attrs from 'src/models/fundPriceRecord/constants/attributeNames'
import { CompanyType, FundPriceChangeRate, FundPriceRecord } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import batchDeleteItems from 'src/models/fundPriceRecord/io/batchDeleteItems'
import queryItemsByCompany, {
  Output as QueryItemsOutput,
  Input as QueryItemsInput,
} from 'src/models/fundPriceRecord/io/queryItemsByCompany'
import TableRange from 'src/models/fundPriceRecord/TableRange.type'
import getCompositeSK from 'src/models/fundPriceRecord/utils/getCompositeSK'
import getCompositeSKFromChangeRate from 'src/models/fundPriceRecord/utils/getCompositeSKFromChangeRate'
import isDuplicated from 'src/models/fundPriceRecord/utils/isDuplicated'
import parse from 'src/models/fundPriceRecord/utils/parse'
import parseChangeRate from 'src/models/fundPriceRecord/utils/parseChangeRate'

const EXP_TIME_SK_PREFIX = ':timeSK' as string

interface ItemsDict {
  record: FundPriceRecord[];
  latest: FundPriceRecord[];
  week: FundPriceChangeRate[];
  month: FundPriceChangeRate[];
  quarter: FundPriceChangeRate[];
}
const getItems = async (company: CompanyType, tableRange: TableRange): Promise<ItemsDict> => {
  const commonInput = {
    shouldQueryAll: true,
    at: tableRange,
  }
  const normalizer = (output: QueryItemsOutput) => (output.Items || []).map(rec => parse(rec))
  const changeRateNormalizer = (output: QueryItemsOutput) => (output.Items || [])
    .map(rec => parseChangeRate(rec))

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

  const recordItems = await queryItemsByCompany(company, commonInput).then(normalizer)
  const latestItems = await queryItemsByCompany(company, {
    ...commonInput,
    shouldQueryLatest: true,
  }).then(normalizer)
  const weekRates = await queryItemsByCompany(company, {
    ...commonInput,
    input: getInputMerger('week'),
  }).then(changeRateNormalizer)
  const monthRates = await queryItemsByCompany(company, {
    ...commonInput,
    input: getInputMerger('month'),
  }).then(changeRateNormalizer)
  const quarterRates = await queryItemsByCompany(company, {
    ...commonInput,
    input: getInputMerger('quarter'),
  }).then(changeRateNormalizer)

  return {
    record: recordItems,
    latest: latestItems,
    week: weekRates,
    month: monthRates,
    quarter: quarterRates,
  }
}

const getDupedRecords = <T extends FundPriceRecord | FundPriceChangeRate> (records: T[]): T[] => {
  const uniqItems: T[] = []
  return records.reduce((acc: T[], record: T) => {
    const hasSameItem = uniqItems.some(uniqRec => isDuplicated(record, uniqRec))
    if (hasSameItem) return [...acc, record]
    uniqItems.push(record)
    return acc
  }, [])
}

type TRecs = FundPriceRecord[] | FundPriceChangeRate[]
type ObjIteratee = (records: ItemsDict[keyof ItemsDict]) => typeof records
const getAllDuped = (itemsDict: ItemsDict) => mapValues<ItemsDict, TRecs>(
  itemsDict,
  getDupedRecords as ObjIteratee
)

const REQUEST_DELAY = 1000

const manipulateEachCompany = async (company: CompanyType, tableRange: TableRange) => {
  const itemsDict = await getItems(company, tableRange)
  const dupedItemsDict = getAllDuped(itemsDict)
  logObj(`Duplicates found for ${company}:`, mapValues(dupedItemsDict, val => val.length))

  const requestSenders = Object.entries(dupedItemsDict)
    .map(([key, records], i, arr) => async () => {
      const k = key as keyof ItemsDict
      type RArgs = [number, Quarter, typeof getCompositeSK]
      type CArgs = [number, Quarter, typeof getCompositeSKFromChangeRate]

      const { year, quarter } = tableRange
      const isRecord = k === 'latest' || k === 'record'
      const getTimeSK = isRecord
        ? getCompositeSK
        : getCompositeSKFromChangeRate

      const recordArgs = [year, quarter, getTimeSK] as RArgs
      const changeRateArgs = [year, quarter, getTimeSK] as CArgs

      if (records.length === 0) return

      if (isRecord) await batchDeleteItems(records as FundPriceRecord[], ...recordArgs)
      else await batchDeleteItems(records as FundPriceChangeRate[], ...changeRateArgs)

      if (i < arr.length - 1) await wait(REQUEST_DELAY)
    })

  await pipeAsync(...requestSenders)()
}

/**
 * De-duplications of records
 */
export const handler: ScheduledHandler = async () => {
  const date = new Date()
  const { year, quarter } = getDateTimeDictionary(date)
  await forEachCompany(company => manipulateEachCompany(company, { year, quarter }))
}