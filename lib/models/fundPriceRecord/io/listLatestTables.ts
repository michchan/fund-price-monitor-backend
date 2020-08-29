import { DynamoDB } from 'aws-sdk';

import getCurrentQuarter, { Quarter } from 'lib/helpers/getCurrentQuarter';
import getTableName from '../utils/getTableName'
import { PROJECT_NAMESPACE } from 'lib/constants';
import db from 'lib/db';
import { Result } from 'lib/db/listAllTables';



export type TableRange = {
    // YYYY
    year: string;
    quarter: Quarter;
}

/**
 * Return a list of properties of tables that have been created and match the criteria
 */
const listLatestTables = async (
    /** Default to current quarter of the current year */
    from?: TableRange,
    limit?: DynamoDB.ListTablesInput['Limit']
): Promise<Result> => {
    // Normalize params
    const _from = from || { year: new Date().getFullYear(), quarter: getCurrentQuarter() };
    // Offset a quarter before the `from.quarter` to make it inclusive
    const exclusiveStartTableName = getTableName(_from.year, _from.quarter, -1)
    // Send list tables request
    const results = await db.listAllTables(exclusiveStartTableName, limit)
    // Filter out non project-scope tables
    return results.filter(name => new RegExp(`^${PROJECT_NAMESPACE}`).test(name))
}
export default listLatestTables