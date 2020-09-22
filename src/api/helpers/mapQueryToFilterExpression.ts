import { StructuredQueryField } from "../StructuredQuery.type";
import between from "src/lib/AWS/dynamodb/expressionFunctions/between";
import beginsWith from "src/lib/AWS/dynamodb/expressionFunctions/beginsWith";
import contains from "src/lib/AWS/dynamodb/expressionFunctions/contains";



const mapQueryToFilterExpression = (
    attrName: string,
    expValueKeys: string[], 
    field: StructuredQueryField,
): string => {
    const { operator } = field
    switch (operator) {
        case 'notinc':
            return `NOT ${contains(attrName, expValueKeys[0])}`
        case 'inc':
            return contains(attrName, expValueKeys[0])
        case 'beginswith':
            return beginsWith(attrName, expValueKeys[0])
        case 'between':
            return between(attrName, expValueKeys[0], expValueKeys[1])
        case 'lte':
            return `${attrName} <= ${expValueKeys[0]}`
        case 'gte':
            return `${attrName} >= ${expValueKeys[0]}`
        case 'lt':
            return `${attrName} < ${expValueKeys[0]}`
        case 'gt':
            return `${attrName} > ${expValueKeys[0]}`
        case 'ie':
            return `${attrName} <> ${expValueKeys[0]}`
        case 'e':
        default:
            return `${attrName} = ${expValueKeys[0]}`
    }
}

export default mapQueryToFilterExpression