import { DocumentClient } from "aws-sdk/clients/dynamodb";

import createParameterErrMsg from "../helpers/createParameterErrMsg";
import { mapValues } from "lodash";



const validateExclusiveStartKey = (exclusiveStartKey: DocumentClient.Key | undefined) => {
    if (typeof exclusiveStartKey !== 'object') 
        throw new Error(createParameterErrMsg('exclusiveStartKey', 'query', 'invalid'));

    return mapValues(exclusiveStartKey, value => {
        if (value && !/^[a-z0-9_-]$/i.test(`${value}`)) 
            throw new Error(createParameterErrMsg('exclusiveStartKey', 'query', 'invalidKeyFormat'));
    })
}

export default validateExclusiveStartKey