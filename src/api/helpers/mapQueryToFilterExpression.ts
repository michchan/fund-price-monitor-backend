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
    const getConnecter = () => {
        switch (operator) {
            case 'notinc': return 'AND'
            default: return 'OR'
        }
    }

    // Map expression
    const expressions = value.split(/([#\,\(\)]+)/i).map((str, i) => {
        // Only handle once for `between` operation
        if (operator === 'between' && i > 0) return ''
        // Replace with expression value key
        if (/^[a-z0-9_\-\.]+$/i.test(str)) {
            const values: string[] = []
            const next = () => _expValueKeys.shift() ?? '';

            // There will be another value to compare for 'between' operation
            if (operator === 'between') {
                values.push(expressEach(next(), next()))
            } else {
                values.push(expressEach(next()))

                // There will be another two casing variants for 'inc' or 'notinc' operation
                if (['inc', 'notinc'].includes(operator)) {
                    values.push(expressEach(next()))
                    values.push(expressEach(next()))
                }
            }
            console.log('Exp ', JSON.stringify({ str, values }, null, 2))
            // Handle casing
            return `(${values.join(` ${getConnecter()} `)})`
        }
        console.log('Exp separator', JSON.stringify({ str }, null, 2))
        return str
            .replace(/\#/g, 'AND')
            .replace(/\,/g, 'OR')
    });
    const expStr = expressions.join(' ');
    console.log('Expression', JSON.stringify({ attrName, expressions, field, expValueKeys }, null, 2))

    return `${expressions.length <= 1 ? expStr : `(${expStr})`}`
}

export default mapQueryToFilterExpression