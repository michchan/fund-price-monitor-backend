import { StructuredQueryField } from "../StructuredQuery.type";
import between from "src/lib/AWS/dynamodb/expressionFunctions/between";
import beginsWith from "src/lib/AWS/dynamodb/expressionFunctions/beginsWith";
import contains from "src/lib/AWS/dynamodb/expressionFunctions/contains";



const mapQueryToFilterExpression = (
    attrName: string,
    expValueKeys: string[], 
    field: StructuredQueryField,
): string => {
    const { operator, value } = field
    // Clone an array for manipulation
    const _expValueKeys = [...expValueKeys]
    
    const expressEach = (value: string) => {
        switch (operator) {
            case 'notinc':
                return `NOT ${contains(attrName, value)}`
            case 'inc':
                return contains(attrName, value)
            case 'beginswith':
                return beginsWith(attrName, value)
            case 'between':
                const [a, b] = value.split('~')
                return between(attrName, a, b)
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
    const getConnecter = () => {
        switch (operator) {
            case 'notinc': return 'AND'
            default: return 'OR'
        }
    }

    return `(${value.split(/(\W+)/i).map((str) => {
        // Replace with expression value key
        if (/^[a-z0-9_\-\.]+$/i.test(str)) {
            // There will be three casing variants for each value
            const capValue = _expValueKeys.shift() ?? ''
            const lowercaseValue = _expValueKeys.shift() ?? ''
            const uppercaseValue = _expValueKeys.shift() ?? ''
            // Handle casing
            return `(${[
                expressEach(capValue),
                expressEach(lowercaseValue),
                expressEach(uppercaseValue),
            ].join(` ${getConnecter()} `)})`
        }
        return str
            .replace(/\#/g, 'AND')
            .replace(/\,/g, 'OR')
    }).join(' ')})`
}

export default mapQueryToFilterExpression