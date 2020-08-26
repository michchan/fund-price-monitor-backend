import { DynamoDB } from 'aws-sdk';

import AWS from 'lib/AWS'
import getCurrentQuarter, { Quarter } from 'lib/helpers/getCurrentQuarter';
import getTableName from './getTableName'
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
 * Return a list of properties of tables that have been created and match the criteria
 */
const listLatestTables = (
    /** Default to current quarter of the current year */
    from?: TableRange,
    limit?: DynamoDB.ListTablesInput['Limit']
): Promise<Result> => new Promise((resolve, reject) => {
    // Normalize params
    const _from = from || { year: new Date().getFullYear(), quarter: getCurrentQuarter() };
    const ExclusiveStartTableName = getTableName(_from.year, _from.quarter, -1)
    console.log({ ExclusiveStartTableName })

    // Send list tables request
    dynamodb.listTables({
        // Offset a quarter before the `from.quarter` to make it inclusive
        ExclusiveStartTableName,
        Limit: limit
    }, (err, data) => {
        if (err) {
            reject(new Error(`Unable to list tables. Error JSON: ${err}`));
        } else {
            resolve((data.TableNames ?? []).filter(name => {
                // Filter out non project-scope tables
                return new RegExp(`^${PROJECT_NAMESPACE}`, 'i').test(name)
            }));
        }
    })
})
export default listLatestTables