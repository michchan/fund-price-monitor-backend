import { APIGatewayProxyHandler } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import mapValues from "lodash/mapValues";

import { ListResponse } from "../Responses.type";
import { FundPriceRecord } from '../../models/fundPriceRecord/FundPriceRecord.type'
import createReadResponse from "../helpers/createReadResponse";
import { StructuredQuery } from "../StructuredQuery.type";
import parseQuery from "../helpers/parseQuery";


export type Res = ListResponse<FundPriceRecord>;

export interface QueryParams {
    latest?: boolean;
    exclusiveStartKey?: DocumentClient.QueryInput['ExclusiveStartKey'];
    q?: StructuredQuery;
}

/** 
 * Get single records
 */
export const handler: APIGatewayProxyHandler = async (event, context, callback) => {
    try {
        // Get query params
        const queryParams = mapValues(event.queryStringParameters ?? {}, (value, key) => {
            if (key === 'latest') return value === 'true'
            if (key === 'q') return parseQuery(value)
            return value
        }) as unknown as QueryParams;
        const { 
            latest,
            exclusiveStartKey,
            q,
        } = queryParams

        console.log('Query: ', JSON.stringify(queryParams, null, 2))

        return {
            statusCode: 200,
            body: JSON.stringify({}, null, 2),
        }
    } catch (error) {
        // Send back failed response
        return createReadResponse(error)
    }
}