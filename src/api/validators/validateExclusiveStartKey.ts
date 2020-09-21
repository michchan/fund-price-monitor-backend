import { DocumentClient } from "aws-sdk/clients/dynamodb";

import createParameterErrMsg from "../helpers/createParameterErrMsg";
import { mapValues } from "lodash";



/**
 * Validate 'exclusiveStartKey'
 * 
 * Reference: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.NamingRulesDataTypes.html
 * 
 * @param exclusiveStartKey 
 */
const validateExclusiveStartKey = (exclusiveStartKey: DocumentClient.Key | undefined) => {
    if (typeof exclusiveStartKey !== 'object') 
        throw new Error(createParameterErrMsg('exclusiveStartKey', 'query', 'invalid'));

    return mapValues(exclusiveStartKey, value => {
        if (value && !/^[a-z0-9_\-\.]{3,255}$/i.test(`${value}`)) 
            throw new Error(createParameterErrMsg('exclusiveStartKey', 'query', 'invalidKeyFormat'));
    })
}

export default validateExclusiveStartKey