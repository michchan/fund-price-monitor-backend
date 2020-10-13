import { DynamoDB } from 'aws-sdk'
import getQuarter from "simply-utils/dist/dateTime/getQuarter"

import { PROJECT_NAMESPACE } from 'src/constants'
import listAllTables, { Result } from 'src/lib/AWS/dynamodb/listAllTables'
import TableRange from '../TableRange.type'



/**
 * Return a list of properties of tables that have been created and match the criteria
 */
const listLatestTables = async (
    /** Default to current quarter of the current year */
    from?: TableRange,
    limit?: DynamoDB.ListTablesInput['Limit']
): Promise<Result> => {
    // Normalize params
    const _from = from || { year: new Date().getFullYear(), quarter: getQuarter() }
    // Send list tables request
    const results = await listAllTables(_from.year, _from.quarter, limit)
    // Filter out non project-scope tables
    return results.filter(name => new RegExp(`^${PROJECT_NAMESPACE}`).test(name))
}
export default listLatestTables