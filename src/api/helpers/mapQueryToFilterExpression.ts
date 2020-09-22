import { StructuredQueryField } from "../StructuredQuery.type";
import between from "src/lib/AWS/dynamodb/expressionFunctions/between";
import beginsWith from "src/lib/AWS/dynamodb/expressionFunctions/beginsWith";
import contains from "src/lib/AWS/dynamodb/expressionFunctions/contains";



const mapQueryToFilterExpression = (
    attrName: string,
    expValueKeys: string[], 
    field: StructuredQueryField,
): string => {
    const { operator, mergeType } = field
    
    const expressEach = (value: string, comparedValue: string = '') => {
        switch (operator) {
            case 'notinc':
                return `NOT ${contains(attrName, value)}`
            case 'inc':
                return contains(attrName, value)
            case 'beginswith':
                return beginsWith(attrName, value)
            case 'between':
                return between(attrName, value, comparedValue)
            case 'lte':
                return `${attrName} <= ${value}`
            case 'gte':
                return `${attrName} >= ${value}`
            case 'lt':
                return `${attrName} < ${value}`
            case 'gt':
                return `${attrName} > ${value}`
            case 'ie':
                return `${attrName} <> ${value}`
            case 'e':
            default:
                return `${attrName} = ${value}`
        }
    }

    return `(${expValueKeys.map((expValKey, i) => {
        return expressEach(expValKey, expValKey[i + 1] ?? expValKey)
    }).join(` ${mergeType === 'intersect' ? 'AND' : 'OR'} `)})`
}

export default mapQueryToFilterExpression