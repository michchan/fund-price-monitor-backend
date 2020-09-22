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
     * 1. Format: FIELD_NAME_1[OPERATOR]VALUE_1+FIELD_NAME_N[OPERATOR]VALUE_N
     * e.g. company[e]aia+code[e]123+name[inc]healthcare+updatedDate[gte]2020-09-10
     *
     * 2. Operators: 
     * 
     *   For general type:
     *    - `e` : is equal to.
     *    - `ie` : is inequal to.
     *    - `gt` : is greater than.
     *    - `lt` : is lower than.
     *    - `gte` : is greater than or equal to.
     *    - `lte` : is greater than or equal to.
     *    - `between` : is between A and B. 
     *      e.g. To query records of updated date in between 2020-09-10 (lower bound) and 2020-09-20 (upper bound),
     *      the expression will be: updatedDate[between]2020-09-10,2020-09-20
     * 
     *   For string only
     *    - `inc` : includes the word(s)
     *      e.g. name[inc]healthcare,growth,fund
     *    - `notinc` : does not include the word(s)
     *    - `beginswith` : begins with word(s)
     * 
     * 3. List values: separated by commas
     * e.g. name[inc]healthcare,growth,fund
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