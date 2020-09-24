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
import mapQueryFieldToFilterExpression from "../helpers/mapQueryFieldToFilterExpression";
import createParameterErrMsg from "../helpers/createParameterErrMsg";
import mapQueryToFilterExpressions from "../helpers/mapQueryToFilterExpressions";
import validateYearQuarter from "../validators/validateYearQuarter";
import yearQuarterToTableRange from "../helpers/yearQuarterToTableRange";



const EXP_TIME_SK_PFX = `:timeSK_prefix` as string

export type Res = ListResponse<FundPriceRecord>;

export interface QueryParams {
    latest?: boolean;
    exclusiveStartKey?: DocumentClient.QueryInput['ExclusiveStartKey'];
    q?: StructuredQuery;
    /** Format: YYYY.(1|2|3|4) */
    quarter?: string;
}

/** 
 * Search all fund records
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
            quarter,
        } = queryParams

        /** ----------- Validations ----------- */

        if (!q) throw new Error(createParameterErrMsg('q', 'query'));
        if (exclusiveStartKey) validateKey(exclusiveStartKey, 'exclusiveStartKey');
        if (quarter) validateYearQuarter(quarter, 'quarter'); 

        /** ----------- Query ----------- */

        // Derive filters
        const [expNames, expValues, filterExp] = mapQueryToFilterExpressions(q);
        // Get table range
        const tableRange = quarter ? yearQuarterToTableRange(quarter) : undefined;

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
        }, false, tableRange);

        // Send back successful response
        return createReadResponse(null, output)
    } catch (error) {
        // Send back failed response
        return createReadResponse(error)
    }
}