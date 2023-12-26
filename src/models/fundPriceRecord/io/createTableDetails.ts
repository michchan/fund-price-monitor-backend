import { Quarter } from 'simply-utils/dateTime/getQuarter'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

import getTableName from '../utils/getTableName'
import FundPriceTableDetails from 'src/models/fundPriceRecord/FundPriceTableDetails.type'
import attrs from '../constants/attributeNames'
import topLevelKeysValues from '../constants/topLevelKeysValues'
import AWS from 'src/lib/AWS'
import putItem, { Output as O } from 'src/lib/AWS/dynamodb/putItem'

const docClient = new AWS.DynamoDB.DocumentClient({ convertEmptyValues: true })

export interface Output extends O {}
function createTableDetails (
  details: Omit<FundPriceTableDetails, 'SK'>,
  year: string | number,
  quarter: Quarter,
): Promise<Output> {
  const { companies, fundTypes, scrapeMeta, testScrapeMeta } = details
  return putItem({
    TableName: getTableName(year, quarter),
    Item: {
      [attrs.COMPANY_CODE]: topLevelKeysValues.DETAILS_PK,
      [attrs.TIME_SK]: topLevelKeysValues.TABLE_DETAILS_SK,
      [attrs.COMPANIES]: companies.length > 0 ? docClient.createSet(companies) : undefined,
      [attrs.FUND_TYPES]: fundTypes.length > 0 ? docClient.createSet(fundTypes) : undefined,
      [attrs.SCRAPE_META]: scrapeMeta,
      [attrs.TEST_SCRAPE_META]: testScrapeMeta,
    } as DocumentClient.AttributeValue,
  })
}

export default createTableDetails