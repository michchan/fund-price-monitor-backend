import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { AWSError } from "aws-sdk";
import mapValues from "lodash/mapValues";

import { ListResponse } from "../Responses.type";
import { FundPriceRecord, CompanyType, RiskLevel } from '../../models/fundPriceRecord/FundPriceRecord.type'
import fundPriceRecord from "src/models/fundPriceRecord";


export type Res = ListResponse<FundPriceRecord>;

export interface PathParams {
    company: CompanyType;
}
export interface QueryParams {
    riskLevel?: RiskLevel;
    latest?: boolean;
}

/** 
 * Get single records
 */
export const handler: APIGatewayProxyHandlerV2<AWSError> = async (event, context, callback) => {
    try {
        console.log(`event `, JSON.stringify(event, null, 2))
        console.log(`context `, JSON.stringify(context, null, 2))

        // Get path params
        const pathParams = (event.pathParameters ?? {}) as unknown as PathParams;
        const { company } = pathParams
        // Get query params
        const queryParams = mapValues(event.queryStringParameters ?? {}, (value, key) => {
            if (key === 'latest') {
                return value === 'true'
            }
            return value
        }) as unknown as QueryParams;
        const { riskLevel, latest } = queryParams

        // @TODO: validations

        // Get query handler by conditions
        const result = await (() => {
            if (riskLevel) {
                
            }
            return fundPriceRecord.queryItemsByCompany(company, latest)
        })(); 

        // Construct response body
        const res: Res = {
            result: true,
            data: (result.Items ?? []) as FundPriceRecord[],
            lastEvaluatedKey: result.LastEvaluatedKey ?? null,
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