import { APIGatewayProxyHandler } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import mapValues from "lodash/mapValues";

import { ListResponse } from "../Responses.type";
import { FundPriceRecord } from '../../models/fundPriceRecord/FundPriceRecord.type'
import createReadResponse from "../helpers/createReadResponse";
import { StructuredQuery } from "../StructuredQuery.type";
import parseQuery from "../helpers/parseQuery";
import validateKey from "../validators/validateKey";
import scanItems from "src/models/fundPriceRecord/io/scanItems";
import attrs from "src/models/fundPriceRecord/constants/attributeNames";
import beginsWith from "src/lib/AWS/dynamodb/expressionFunctions/beginsWith";



const EXP_TIME_SK_PFX = `:timeSK_prefix` as string

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

        /** ----------- Validations ----------- */

        if (exclusiveStartKey) validateKey(exclusiveStartKey, 'exclusiveStartKey');

        /** ----------- Query ----------- */

        // Query
        const output = await scanItems({
            ExclusiveStartKey: exclusiveStartKey,
            ExpressionAttributeValues: {
                [EXP_TIME_SK_PFX]: latest ? 'latest' : 'record'
            },
            FilterExpression: beginsWith(attrs.TIME_SK, EXP_TIME_SK_PFX),
        }, false);

        // Send back successful response
        return createReadResponse(null, output)
    } catch (error) {
        // Send back failed response
        return createReadResponse(error)
    }
}