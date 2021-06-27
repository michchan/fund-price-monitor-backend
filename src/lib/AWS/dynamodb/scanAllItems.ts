import { DynamoDB } from 'aws-sdk'

import queryOrScanAllItems from './queryOrScanAllItems'

export type Input = DynamoDB.DocumentClient.ScanInput
export type Output = DynamoDB.DocumentClient.ScanOutput
/**
 * Return a list of properties of tables that have been created and match the criteria
 */
const scanAllItems = (input: Input, delay?: number): Promise<Output> => queryOrScanAllItems<Input, Output>('scan', input, delay)

export default scanAllItems