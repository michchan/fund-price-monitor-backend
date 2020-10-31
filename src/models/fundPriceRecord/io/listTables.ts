import { DynamoDB } from 'aws-sdk'
import getQuarterOffset from 'simply-utils/dist/dateTime/getQuarterOffset'

import { PROJECT_NAMESPACE } from 'src/constants'
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
  const [exclusiveYear, exclusiveQuarter] = (() => {
    if (!from) return [undefined, undefined]
    // Normalize params
    const { year, quarter } = from
    // Get the previous quarter
    // Because `listAllTables` will return table names sorted in ASC.
    return getQuarterOffset(year, quarter, -1)
  })()
  // Send list tables request
  const results = await listAllTables(exclusiveYear, exclusiveQuarter, limit)
  // Filter out non project-scope tables
  return results.filter(name => new RegExp(`^${PROJECT_NAMESPACE}`).test(name))
}
export default listTables