import getQuarter from 'simply-utils/dist/dateTime/getQuarter'

import queryAllItems, { Input } from 'src/lib/AWS/dynamodb/queryAllItems'
import TableRange from '../TableRange.type'
import getTableName from '../utils/getTableName'
import { CompanyType, FundType } from '../FundPriceRecord.type'
import FundPriceTableDetails, { ScrapeMeta } from 'src/models/fundPriceRecord/FundPriceTableDetails.type'
import attrs from '../constants/attributeNames'
import topLevelKeysValues from '../constants/topLevelKeysValues'
import { DynamoDB } from 'aws-sdk'
import defaultScrapeMeta from '../constants/defaultScrapeMeta'

type SS = DynamoDB.DocumentClient.StringSet
type MapV = DynamoDB.DocumentClient.MapAttributeValue

const EXP_PK = ':pk'
const EXP_SK = ':sk'

const getTableDetails = async (
  input?: Omit<Input, 'TableName' | 'ExpressionAttributeValues' | 'KeyConditionExpression'>,
  /** Default to current quarter of the current year */
  from?: TableRange,
): Promise<FundPriceTableDetails> => {
  // Normalize params
  const { year, quarter } = from || {
    year: new Date().getFullYear(),
    quarter: getQuarter(),
  }
  const TableName = getTableName(year, quarter)

  const output = await queryAllItems({
    ...input,
    TableName,
    ExpressionAttributeValues: {
      [EXP_PK]: topLevelKeysValues.DETAILS_PK,
      [EXP_SK]: topLevelKeysValues.TABLE_DETAILS_SK,
    },
    KeyConditionExpression: [
      `${attrs.COMPANY_CODE} = ${EXP_PK}`,
      `${attrs.TIME_SK} = ${EXP_SK}`,
    ].join(' AND '),
  })

  const [item] = (output.Items || [])
  if (!item) throw new Error(`tableDetails row is not defined for table: ${TableName}`)

  const companiesSet = item[attrs.COMPANIES] as SS | undefined
  const fundTypesSet = item[attrs.FUND_TYPES] as SS | undefined
  const scrapeMetaMap = item[attrs.SCRAPE_META] as MapV | undefined
  const testScrapeMetaMap = item[attrs.TEST_SCRAPE_META] as MapV | undefined

  return {
    SK: item[attrs.TIME_SK].split('@').pop(),
    // Parse sets to array
    companies: companiesSet ? companiesSet.values as CompanyType[] : [],
    fundTypes: fundTypesSet ? fundTypesSet.values as FundType[] : [],
    scrapeMeta: scrapeMetaMap ? scrapeMetaMap as ScrapeMeta : defaultScrapeMeta,
    testScrapeMeta: testScrapeMetaMap ? testScrapeMetaMap as ScrapeMeta : defaultScrapeMeta,
  }
}

export default getTableDetails