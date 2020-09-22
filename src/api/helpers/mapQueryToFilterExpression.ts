import { StructuredQueryField } from "../StructuredQuery.type";
import between from "src/lib/AWS/dynamodb/expressionFunctions/between";
import beginsWith from "src/lib/AWS/dynamodb/expressionFunctions/beginsWith";
import contains from "src/lib/AWS/dynamodb/expressionFunctions/contains";



const mapQueryToFilterExpression = (
    attrName: string,
    expValueKeys: string[], 
    field: StructuredQueryField,
): string => {
    const { operator, value, values } = field
    // Clone an array for manipulation
    const _expValueKeys = [...expValueKeys]
    
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

    return `(${value.split(/(\W)+/i).map((str) => {
        // Replace with expression value key
        if (/^[a-z0-9_\-\.]+$/i.test(str)) {
            return _expValueKeys.shift()
        }
        if (/^\#$/.test(str)) return `AND`
        if (/^\,$/.test(str)) return `OR`
        return str
    }).join(' ')})`
}

export default mapQueryToFilterExpression