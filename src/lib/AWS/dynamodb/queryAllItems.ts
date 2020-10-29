import { DynamoDB } from 'aws-sdk'

import queryOrScanAllItems from './queryOrScanAllItems'

export type Input = DynamoDB.DocumentClient.QueryInput
export type Output = DynamoDB.DocumentClient.QueryOutput
/**
 * Return a list of properties of tables that have been created and match the criteria
 */
const queryAllItems = (input: Input, delay?: number): Promise<Output> => queryOrScanAllItems<Input, Output>('query', input, delay)

export default queryAllItems