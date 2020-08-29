import { DynamoDB } from 'aws-sdk';

import AWS from 'lib/AWS'


// Initialize
const docClient = new AWS.DynamoDB.DocumentClient();

export type Result = DynamoDB.QueryOutput
/**
 * Return a list of properties of tables that have been created and match the criteria
 */
const queryAllItems = (
    input: DynamoDB.QueryInput,
    previousResult: null | Result = null,
): Promise<Result> => new Promise((resolve, reject) => {
    docClient.query(input, async (err, data) => {
        if (err) {
            reject(new Error(`Unable to query items. Error JSON: ${err}`));
        } else {
            if (data.LastEvaluatedKey) {
                resolve(await queryAllItems({
                    ...input,
                    ExclusiveStartKey: data.LastEvaluatedKey,
                }, data))
            } else {
                // Merge with previousResult
                resolve(((nextResult: Result): Result => {
                    if (!previousResult) return nextResult
                    return {
                        ...nextResult,
                        Items: [...previousResult.Items ?? [], ...nextResult.Items ?? []],
                        Count: (previousResult.Count ?? 0) + (nextResult.Count ?? 0),
                        ScannedCount: (previousResult.ScannedCount) ?? 0 + (nextResult.ScannedCount ?? 0),
                    }
                })(data))
            }
        }
    })
})
export default queryAllItems