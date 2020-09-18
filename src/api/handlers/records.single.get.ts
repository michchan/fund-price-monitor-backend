import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { AWSError } from "aws-sdk";

import { ListResponse } from "../ListResponse.type";
import { FundPriceRecord } from '../../models/fundPriceRecord/FundPriceRecord.type'


export type Res = ListResponse<FundPriceRecord>;

/** 
 * Get single records
 */
export const handler: APIGatewayProxyHandlerV2<AWSError> = async (event, context, callback) => {
    try {
        console.log(`event `, JSON.stringify(event, null, 2))
        console.log(`context `, JSON.stringify(context, null, 2))

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