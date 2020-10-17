import { Quarter } from "simply-utils/dist/dateTime/getQuarter"
import { DocumentClient } from "aws-sdk/clients/dynamodb"

import getTableName from "../utils/getTableName"
import { FundPriceTableDetails } from "../FundPriceRecord.type"
import attrs from "../constants/attributeNames"
import topLevelKeysValues from "../constants/topLevelKeysValues"
import AWS from 'src/lib/AWS'
import putItem from "src/lib/AWS/dynamodb/putItem"


const docClient = new AWS.DynamoDB.DocumentClient({ convertEmptyValues: true })

function createTableDetails (
  details: FundPriceTableDetails,
  year: string | number,
  quarter: Quarter,
) {
  const { companies, fundTypes } = details

  return putItem({
    TableName: getTableName(year, quarter),
    Item: {
      [attrs.COMPANY_CODE]: topLevelKeysValues.DETAILS_PK,
      [attrs.TIME_SK]: topLevelKeysValues.TABLE_DETAILS_SK,
      [attrs.COMPANIES]: companies.length > 0 ? docClient.createSet(companies) : undefined,
      [attrs.FUND_TYPES]: fundTypes.length > 0 ? docClient.createSet(fundTypes) : undefined,
    } as DocumentClient.AttributeValue,
  })
}

export default createTableDetails
