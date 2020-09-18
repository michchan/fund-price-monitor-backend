import { DynamoDB } from 'aws-sdk';
import getQuarter, { Quarter } from "simply-utils/dist/dateTime/getQuarter";

import getTableName from '../utils/getTableName'
import { PROJECT_NAMESPACE } from 'src/constants';
import listAllTables, { Result } from 'src/lib/AWS/dynamodb/listAllTables';
import TableRange from '../TableRange.type';



/**
 * Return a list of properties of tables that have been created and match the criteria
 */
const listLatestTables = async (
    /** Default to current quarter of the current year */
    from?: TableRange,
    limit?: DynamoDB.ListTablesInput['Limit']
): Promise<Result> => {
    // Normalize params
    const _from = from || { year: new Date().getFullYear(), quarter: getQuarter() };
    // Offset a quarter before the `from.quarter` to make it inclusive
    const exclusiveStartTableName = getTableName(_from.year, _from.quarter, -1)
    // Send list tables request
    const results = await listAllTables(exclusiveStartTableName, limit)
    // Filter out non project-scope tables
    return results.filter(name => new RegExp(`^${PROJECT_NAMESPACE}`).test(name))
}
export default listLatestTables