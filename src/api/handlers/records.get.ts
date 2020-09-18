import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { AWSError } from "aws-sdk";


/** 
 * Get single records
 */
export const handler: APIGatewayProxyHandlerV2<AWSError> = async (event, context, callback) => {
    try {


        return {
            statusCode: 200,
            body: JSON.stringify({
                result: true,
                data: [],
            }, null, 2),
        }
    } catch (error) {
        callback(error)
        return {
            statusCode: 502,
            body: JSON.stringify({
                result: false,
                error: JSON.stringify(error, null, 2),
            }, null, 2),
        }
    }
}