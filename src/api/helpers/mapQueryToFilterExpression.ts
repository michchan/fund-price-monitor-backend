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

    // Map expression
    const expressions = value.split(/(\W+)/i).map((str) => {
        // Replace with expression value key
        if (/^[a-z0-9_\-\.]+$/i.test(str)) {
            const values: string[] = []
            values.push(expressEach(_expValueKeys.shift() ?? ''))

            // There will be three casing variants for each value
            if (['inc', 'notinc'].includes(operator)) {
                values.push(expressEach(_expValueKeys.shift() ?? ''))
                values.push(expressEach(_expValueKeys.shift() ?? ''))
            }
            // Handle casing
            return `(${values.join(` ${getConnecter()} `)})`
        }
        return str
            .replace(/\#/g, 'AND')
            .replace(/\,/g, 'OR')
    });
    const expStr = expressions.join(' ');

    return `${expressions.length <= 1 ? expStr : `(${expStr})`}`
}

export default mapQueryToFilterExpression