import AWS from 'src/lib/AWS'


// Initialize
const docClient = new AWS.DynamoDB.DocumentClient({ convertEmptyValues: true });

export type Input = AWS.DynamoDB.DocumentClient.ScanInput
export type Output = AWS.DynamoDB.DocumentClient.ScanOutput

function scanItems (input: Input): Promise<Output> {
    return docClient.scan(input).promise();
}

export default scanItems