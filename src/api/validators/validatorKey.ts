import { DocumentClient } from "aws-sdk/clients/dynamodb";

import createParameterErrMsg from "../helpers/createParameterErrMsg";
import { mapValues } from "lodash";



/**
 * Validate 'key' of dynamodb document client
 * 
 * Reference: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.NamingRulesDataTypes.html
 * 
 * @param exclusiveStartKey 
 */
const validatorKey = (key: DocumentClient.Key | undefined, fieldName: string) => {
    if (typeof key !== 'object') 
        throw new Error(createParameterErrMsg(fieldName, 'query', 'invalid'));

    return mapValues(key, value => {
        if (value && !/^[a-z0-9_\-\.]{3,255}$/i.test(`${value}`)) 
            throw new Error(createParameterErrMsg(fieldName, 'query', 'invalidKeyFormat'));
    })
}

export default validatorKey