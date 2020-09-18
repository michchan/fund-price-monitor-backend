import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { AWSError } from "aws-sdk";
import mapValues from "lodash/mapValues";
import pick from "lodash/pick";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { ListResponse } from "../Responses.type";
import { FundPriceRecord, CompanyType, RiskLevel } from '../../models/fundPriceRecord/FundPriceRecord.type'
import attrs from "src/models/fundPriceRecord/constants/attributeNames";
import beginsWith from "src/lib/AWS/dynamodb/expressionFunctions/beginsWith";
import isValidCompany from "src/models/fundPriceRecord/utils/isValidCompany";
import isValidRiskLevel from "src/models/fundPriceRecord/utils/isValidRiskLevel";
import queryItemsByRiskLevel from "src/models/fundPriceRecord/io/queryItemsByRiskLevel";
import queryItemsByCompany from "src/models/fundPriceRecord/io/queryItemsByCompany";



const EXP_COM = ':com_code'

export type Res = ListResponse<FundPriceRecord>;

export interface PathParams {
    company: CompanyType;
}
export interface QueryParams {
    riskLevel?: RiskLevel;
    latest?: boolean;
    exclusiveStartKey?: DocumentClient.QueryInput['ExclusiveStartKey'];
}

/** 
 * Get single records
 */
export const handler: APIGatewayProxyHandlerV2<AWSError> = async (event, context) => {
    try {
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
        const { 
            riskLevel, 
            latest,
            exclusiveStartKey,
        } = queryParams

        /** ----------- Validations ----------- */
        
        if (!isValidCompany(company))
            throw new Error(`Path Parameter 'company' is invalid`);
        if (riskLevel && !isValidRiskLevel(riskLevel))
            throw new Error(`Query Parameter 'riskLevel' is invalid`);
        // @TODO: Refractor this
        if (exclusiveStartKey && !/^[a-z0-9_-]$/i.test(`${exclusiveStartKey}`)) 
            throw new Error(`Query parameter 'exclusiveStartKey' must be a valid string / number in AWS Dynamodb key definition.`);

        /** ----------- Query ----------- */

        // Get query handler by conditions
        const result = await (() => {
            if (riskLevel) {
                return queryItemsByRiskLevel(riskLevel, latest, false, undefined, defaultInput => ({
                    ExclusiveStartKey: exclusiveStartKey,
                    ExpressionAttributeValues: {
                        ...defaultInput.ExpressionAttributeValues,
                        // Add company constraint
                        [EXP_COM]: company
                    },
                    FilterExpression: [
                        defaultInput.FilterExpression,
                        beginsWith(attrs.COMPANY_CODE, EXP_COM),
                    ].filter(v => v).join(' AND ')
                }))
            }
            return queryItemsByCompany(company, latest, false, undefined, {
                ExclusiveStartKey: exclusiveStartKey
            })
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
        const err = error as AWSError
        console.log(`ERROR: `, JSON.stringify(err, null, 2));

        const res: Res = { 
            result: false, 
            error: pick(err, ['message', 'code'])
        }
        return {
            statusCode: err.statusCode,
            body: JSON.stringify(res, null, 2)
        }
    }
}