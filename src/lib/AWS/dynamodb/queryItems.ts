import AWS from 'src/lib/AWS'


// Initialize
const docClient = new AWS.DynamoDB.DocumentClient({ convertEmptyValues: true })

export type Input = AWS.DynamoDB.DocumentClient.QueryInput
export type Output = AWS.DynamoDB.DocumentClient.QueryOutput

function queryItems (input: Input): Promise<Output> {
    return docClient.query(input).promise()
}

export default queryItems