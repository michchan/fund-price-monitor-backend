

const beginsWith = (attributeName: string, value: string) => `begins_with (${attributeName}, ${value})`


const expressionFunctions = {
    beginsWith,
} as const
export default expressionFunctions