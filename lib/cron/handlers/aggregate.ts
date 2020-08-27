import { DynamoDBStreamHandler } from "aws-lambda";



export const handler: DynamoDBStreamHandler = async (event, context, callback) => {
    console.log({
        event,
        context,
    })
}