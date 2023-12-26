import getQuarter from 'simply-utils/dateTime/getQuarter'

import queryAllItems, { Input, Output as O } from 'src/lib/AWS/dynamodb/queryAllItems'
import TableRange from '../TableRange.type'
import getTableName from '../utils/getTableName'
import _queryItems from 'src/lib/AWS/dynamodb/queryItems'

export interface Output extends O {}
const queryItems = (
  input: Omit<Input, 'TableName'>,
  shouldQueryAll?: boolean,
  /** Default to current quarter of the current year */
  at?: TableRange,
): Promise<Output> => {
  // Normalize params
  const { year, quarter } = at || {
    year: new Date().getFullYear(),
    quarter: getQuarter(),
  }
  const query = shouldQueryAll ? queryAllItems : _queryItems

  return query({
    ...input,
    TableName: getTableName(year, quarter),
  })
}

export default queryItems