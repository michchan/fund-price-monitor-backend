import { APIGatewayProxyHandler } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { ListResponse } from "../Responses.type";
import { FundPriceRecord } from '../../models/fundPriceRecord/FundPriceRecord.type'
import createReadResponse from "../helpers/createReadResponse";


export type Res = ListResponse<FundPriceRecord>;

export interface QueryParams {
    latest?: boolean;
    exclusiveStartKey?: DocumentClient.QueryInput['ExclusiveStartKey'];
    /**
     * Structured query string:
     *
     * Format: FIELD_NAME_1[OPERATOR]VALUE_1+FIELD_NAME_N[OPERATOR]VALUE_N
     * 
     * e.g. company[e]aia+code[e]123+name[inc]healthcare+updatedDate[gte]2020-09-10
     */
    q?: string;
}

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
        // Send back failed response
        return createReadResponse(error)
    }
}