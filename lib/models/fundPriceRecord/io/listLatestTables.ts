import { DynamoDB } from 'aws-sdk';

import AWS from 'lib/AWS'
import getCurrentQuarter, { Quarter } from 'lib/helpers/getCurrentQuarter';
import getTableName from './utils/getTableName'
import { PROJECT_NAMESPACE } from 'lib/constants';


// Initialize
const dynamodb = new AWS.DynamoDB();


export type TableRange = {
    // YYYY
    year: string;
    quarter: Quarter;
}

export type Result = DynamoDB.TableNameList

/**
 * List table recursively
 */
const listTablesRecur = (
    accTableNames: DynamoDB.TableNameList,
    ExclusiveStartTableName: string,
    Limit?: DynamoDB.ListTablesInput['Limit'],
): Promise<Result> => new Promise((resolve, reject) => {
    dynamodb.listTables({
        ExclusiveStartTableName,
        Limit,
    }, async (err, data) => {
        if (err) {
            reject(new Error(`Unable to list tables. Error JSON: ${err}`));
        } else {
            const { TableNames = [], LastEvaluatedTableName } = data
            const mergedTableNames = [...accTableNames, ...TableNames]

            if (LastEvaluatedTableName) {
                // recur next
                resolve(await listTablesRecur(
                    mergedTableNames,
                    ExclusiveStartTableName,
                    Limit,
                ))
            } else {
                // End recur
                resolve(mergedTableNames);
            }
        }
    })
})

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
    const results = await listTablesRecur([], exclusiveStartTableName, limit)
    // Filter out non project-scope tables
    return results.filter(name => new RegExp(`^${PROJECT_NAMESPACE}`).test(name))
}
export default listLatestTables