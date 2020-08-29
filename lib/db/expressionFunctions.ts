

const beginsWith = (attributeName: string, value: string) => `begins_with(${attributeName}, ${attributeName})`


const expressionFunctions = {
    beginsWith,
} as const
export default expressionFunctions