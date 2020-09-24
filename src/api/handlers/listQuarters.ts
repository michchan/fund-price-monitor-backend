import { APIGatewayProxyHandler } from "aws-lambda";

import createReadResponse from "../helpers/createReadResponse";
import listAllTables from "src/lib/AWS/dynamodb/listAllTables";
import { ListResponse } from "../Responses.type";
import createParameterErrMsg from "../helpers/createParameterErrMsg";
import { Quarter } from "simply-utils/dist/dateTime/getQuarter";


export interface QueryParams {
    /** Format: YYYY.(1|2|3|4) */
    exclusiveStartQuarter?: string,
}

/** 
 * Get list of quarters (YYYY.(1|2|3|4)) available for data resouces
 */
export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        const queryParams = event.queryStringParameters as QueryParams;
        const { exclusiveStartQuarter } = queryParams
        
        /** ----------- Validations ----------- */
        if (exclusiveStartQuarter && !/^([0-9]{4})\.[1-4]$/.test(exclusiveStartQuarter)) 
            throw new Error(createParameterErrMsg('exclusiveStartQuarter', 'query'))

        /** ----------- Query ----------- */

        // Extract query params
        const [year, quarter] = exclusiveStartQuarter?.split('.') ?? [];
        
        // Query
        const tableNames = await listAllTables(year, quarter as unknown as Quarter);
        // Create response
        const response: ListResponse<string> = {
            result: true,
            data: (tableNames ?? [])
                .map(tableName => tableName.match((/[0-9]{4}_q[1-4]/))?.shift() ?? '')
                .filter(v => !!v),
        }
        return {
            statusCode: 200,
            body: JSON.stringify(response, null, 2)
        }
    } catch (error) {
        // Send back failed response
        return createReadResponse(error)
    }
}