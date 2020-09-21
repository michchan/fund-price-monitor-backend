


export type ParamType = 'path' | 'query'
export type MessageType = 
    | 'invalid' 
    | 'invalidKeyFormat'

const createParameterErrMsg = (
    fieldName: string,
    paramType: ParamType = 'query',
    messageType: MessageType = 'invalid',
): string => {
    const paramName = `${paramType.charAt(0).toUpperCase()}${paramType.slice(1)}`
    const msg = (() => {
        switch (messageType) {
            case 'invalidKeyFormat':
                return 'must be a valid string/number under AWS Dynamodb\'s key definition. See https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.NamingRulesDataTypes.html.'
            case 'invalid':
            default:
                return 'is invalid'
        }
    })()
    return `${paramName} parameter '${fieldName}' ${msg}`
}

export default createParameterErrMsg