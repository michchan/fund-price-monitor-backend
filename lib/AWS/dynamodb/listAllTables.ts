import { DynamoDB } from 'aws-sdk';

import AWS from 'lib/AWS/AWS'


// Initialize
const dynamodb = new AWS.DynamoDB();

export type Result = DynamoDB.TableNameList

/**
 * List table recursively
 */
const listAllTables = (
    ExclusiveStartTableName: string,
    Limit?: DynamoDB.ListTablesInput['Limit'],
    accTableNames: DynamoDB.TableNameList = [],
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
                resolve(await listAllTables(
                    ExclusiveStartTableName,
                    Limit,
                    mergedTableNames,
                ))
            } else {
                // End recur
                resolve(mergedTableNames);
            }
        }
    })
})

export default listAllTables