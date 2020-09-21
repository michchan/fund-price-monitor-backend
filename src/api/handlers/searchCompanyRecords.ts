import { APIGatewayProxyHandler } from "aws-lambda";
import { AWSError } from "aws-sdk";

import { ListResponse } from "../Responses.type";
import { FundPriceRecord } from '../../models/fundPriceRecord/FundPriceRecord.type'


export type Res = ListResponse<FundPriceRecord>;

/** 
 * Get single records
 */
export const handler: APIGatewayProxyHandler = async (event, context, callback) => {
    try {
        console.log(`event `, JSON.stringify(event, null, 2))
        console.log(`context `, JSON.stringify(context, null, 2))
        // Construct response body
        const res: Res = {
            result: true,
            data: [],
        }
        return {
            statusCode: 200,
            body: JSON.stringify(res, null, 2),
        }
    } catch (error) {
        callback(error)
        const res: Res = { result: false, error }
        return {
            statusCode: 502,
            body: JSON.stringify(res, null, 2),
        }
    }
}