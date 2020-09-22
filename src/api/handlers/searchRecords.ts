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
import mapQueryToFilterExpression from "../helpers/mapQueryToFilterExpression";



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
            q = [],
        } = queryParams
        console.log('Query: ', JSON.stringify(queryParams, null, 2))

        /** ----------- Validations ----------- */

        if (exclusiveStartKey) validateKey(exclusiveStartKey, 'exclusiveStartKey');

        /** ----------- Query ----------- */

        // Derive filters
        const [expNames, expValues, filterExp] = ((q: StructuredQuery): [
            DocumentClient.QueryInput['ExpressionAttributeNames'],
            DocumentClient.QueryInput['ExpressionAttributeValues'],
            string[],
        ] => {
            const expNames: DocumentClient.QueryInput['ExpressionAttributeNames'] = {}
            const expValues: DocumentClient.QueryInput['ExpressionAttributeValues'] = {}
            const filterExp: string[] = []

            q.forEach(field => {
                const { name, values } = field
                const attrName = `#${name}`
                const expValueKeys = values.map((v, i) => `:${name}${i}`)

                // Assign attr name
                expNames[attrName] = name
                // Map keys and values
                expValueKeys.forEach((key, i) => {
                    expValues[key] = values[i]
                })
                // Create expression
                filterExp.push(mapQueryToFilterExpression(attrName, expValueKeys, field))
            });

            return [expNames, expValues, filterExp]
        })(q);
        console.log('Filters: ', JSON.stringify({ expNames, expValues, filterExp }, null, 2))

        // Query
        const output = await scanItems({
            ExclusiveStartKey: exclusiveStartKey,
            ExpressionAttributeNames: expNames,
            ExpressionAttributeValues: {
                ...expValues,
                [EXP_TIME_SK_PFX]: latest ? 'latest' : 'record'
            },
            FilterExpression: [
                beginsWith(attrs.TIME_SK, EXP_TIME_SK_PFX),
                ...filterExp,
            ].join(' AND '),
        }, false);

        // Send back successful response
        return createReadResponse(null, output)
    } catch (error) {
        // Send back failed response
        return createReadResponse(error)
    }
}