import { DynamoDB } from 'aws-sdk';

import AWS from 'src/lib/AWS'


// Initialize
const docClient = new AWS.DynamoDB.DocumentClient();

export type Input = AWS.DynamoDB.DocumentClient.PutItemInput
export type Output = AWS.DynamoDB.DocumentClient.PutItemOutput

function putItem (input: Input): Promise<Output> {
    return docClient.put(input).promise();
}

export default putItem