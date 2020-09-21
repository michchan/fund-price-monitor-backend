import { APIGatewayProxyHandler } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { ListResponse } from "../Responses.type";
import { FundPriceChangeRate, CompanyType } from '../../models/fundPriceRecord/FundPriceRecord.type'
import createReadResponse from "../helpers/createReadResponse";
import validateCompany from "../validators/validateCompany";
import validateKey from "../validators/validateKey";
import validatePeriod, { PeriodType } from "../validators/validatePeriod";
import queryPeriodPriceChangeRate from "src/models/fundPriceRecord/io/queryPeriodPriceChangeRate";


export type Res = ListResponse<FundPriceChangeRate>;

export interface PathParams {
    company: CompanyType;
    /** Either `week`, `month` or `quarter` */
    period: string;
}
export interface QueryParams {
    exclusiveStartKey?: DocumentClient.QueryInput['ExclusiveStartKey'];
}

/** 
 * Get single records
 */
export const handler: APIGatewayProxyHandler = async (event, context, callback) => {
    try {
        // Get path params
        const { company, period } = (event.pathParameters ?? {}) as unknown as PathParams;
        // Get query params
        const { exclusiveStartKey } = (event.queryStringParameters ?? {}) as unknown as QueryParams;

        // Get period type
        const periodType = ((path: string): PeriodType => {
            switch (true) {
                case path.includes('quarter'):
                    return 'quarter'
                case path.includes('month'):
                    return 'month'
                case path.includes('week'):
                default:
                    return 'week'
            }
        })(event.path);

        /** ----------- Validations ----------- */

        validateCompany(company);
        validatePeriod(period, periodType);
        if (exclusiveStartKey) validateKey(exclusiveStartKey, 'exclusiveStartKey');

        /** ----------- Query ----------- */

        // Query
        const output = await queryPeriodPriceChangeRate(company, periodType, period, false, undefined, {
            ExclusiveStartKey: exclusiveStartKey
        })

        // Send back successful response
        return createReadResponse(null, output)
    } catch (error) {
        // Send back failed response
        return createReadResponse(error)
    }
}