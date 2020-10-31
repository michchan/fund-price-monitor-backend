import { DynamoDB } from 'aws-sdk'
import getQuarter from 'simply-utils/dist/dateTime/getQuarter'

import { PROJECT_NAMESPACE } from 'src/constants'
import getOffsetQuarter from 'src/helpers/getOffsetQuarter'
import listAllTables, { Output } from 'src/lib/AWS/dynamodb/listAllTables'
import TableRange from '../TableRange.type'

/**
 * Return a list of properties of tables that have been created and match the criteria
 */
const listTables = async (
  /** Default to current quarter of the current year */
  from?: TableRange,
  limit?: DynamoDB.ListTablesInput['Limit']
): Promise<Output> => {
  // Normalize params
  const { year, quarter } = from || {
    year: new Date().getFullYear(),
    quarter: getQuarter(),
  }
  // Get the previous quarter
  // Because `listAllTables` will return table names sorted in ASC.
  const [prevYear, prevQuarter] = getOffsetQuarter(year, quarter, -1)
  // Send list tables request
  const results = await listAllTables(prevYear, prevQuarter, limit)
  // Filter out non project-scope tables
  return results.filter(name => new RegExp(`^${PROJECT_NAMESPACE}`).test(name))
}
export default listTables