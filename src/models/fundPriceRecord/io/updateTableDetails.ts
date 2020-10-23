import { Quarter } from 'simply-utils/dist/dateTime/getQuarter'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

import getTableName from '../utils/getTableName'
import attrs from '../constants/attributeNames'
import topLevelKeysValues from '../constants/topLevelKeysValues'
import updateItem, { Input, Output as O } from 'src/lib/AWS/dynamodb/updateItem'

export interface Output extends O {}

function updateTableDetails (
  input: Omit<Input, 'TableName' | 'Key'>,
  year: string | number,
  quarter: Quarter,
): Promise<Output> {
  return updateItem({
    ...input,
    TableName: getTableName(year, quarter),
    Key: {
      [attrs.COMPANY_CODE]: `${topLevelKeysValues.DETAILS_PK}`,
      [attrs.TIME_SK]: `${topLevelKeysValues.TABLE_DETAILS_SK}`,
    } as DocumentClient.AttributeValue,
  })
}

export default updateTableDetails