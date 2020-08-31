import { DynamoDB } from 'aws-sdk';

import AWS from '../AWS'


// Initialize
const docClient = new AWS.DynamoDB.DocumentClient();

/**
 * Return a list of properties of tables that have been created and match the criteria
 */
function queryOrScanAllItems <
    Input extends DynamoDB.DocumentClient.QueryOutput | DynamoDB.DocumentClient.ScanInput,
    Output extends DynamoDB.DocumentClient.QueryOutput | DynamoDB.DocumentClient.ScanOutput,
> (
    method: 'scan' | 'query',
    input: Input,
    previousResult: null | Output = null,
): Promise<Output> {
    return new Promise((resolve, reject) => {
        // @ts-expect-error: @TODO: Fix type
        docClient[method](input, async (err, data) => {
            if (err) {
                reject(new Error(`Unable to query items. Error JSON: ${err}`));
            } else {
                // Merge results
                const mergedResults = mergeResults<Output>(previousResult, data as Output)
                
                if (data.LastEvaluatedKey) {
                    resolve(await queryOrScanAllItems<Input, Output>(method, {
                        ...input,
                        ExclusiveStartKey: data.LastEvaluatedKey,
                    }, mergedResults))
                } else {
                    // Merge with previousResult
                    resolve(mergedResults)
                }
            }
        })
    })
}
export default queryOrScanAllItems


/** Merge previous and next results */
function mergeResults <Output extends DynamoDB.DocumentClient.QueryOutput | DynamoDB.DocumentClient.ScanOutput> (
    previousResult: null | Output, 
    nextResult: Output
): Output {
    if (!previousResult) return nextResult
    return {
        ...nextResult,
        Items: [...previousResult.Items ?? [], ...nextResult.Items ?? []],
        Count: (previousResult.Count ?? 0) + (nextResult.Count ?? 0),
        ScannedCount: (previousResult.ScannedCount) ?? 0 + (nextResult.ScannedCount ?? 0),
    }
}