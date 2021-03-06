import AWS from 'src/lib/AWS'

// Initialize
const docClient = new AWS.DynamoDB.DocumentClient({ convertEmptyValues: true })

export type Input = AWS.DynamoDB.DocumentClient.UpdateItemInput
export type Output = AWS.DynamoDB.DocumentClient.UpdateItemOutput

function updateItem (input: Input): Promise<Output> {
  return docClient.update(input).promise()
}

export default updateItem