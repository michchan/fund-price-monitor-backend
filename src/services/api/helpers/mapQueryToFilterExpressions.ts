import { DocumentClient } from "aws-sdk/clients/dynamodb"

import { StructuredQuery } from "../StructuredQuery.type"
import mapQueryFieldToFilterExpression from "./mapQueryFieldToFilterExpression"


export type ReturnType = [
    DocumentClient.QueryInput['ExpressionAttributeNames'],
    DocumentClient.QueryInput['ExpressionAttributeValues'],
    // Filter expression lines
    string[],
]

const mapQueryToFilterExpressions = (q: StructuredQuery): ReturnType => {
    const expNames: DocumentClient.QueryInput['ExpressionAttributeNames'] = {}
    const expValues: DocumentClient.QueryInput['ExpressionAttributeValues'] = {}
    const filterExp: string[] = []

    q.forEach((field, index) => {
        const { name, values } = field
        const attrName = `#${name}`
        const expValueKeys = values.map((v, i) => `:${name}_${index}_${i}`)

        // Assign attr name
        expNames[attrName] = name
        // Map keys and values
        expValueKeys.forEach((key, i) => {
            expValues[key] = values[i]
        })
        // Create expression
        filterExp.push(mapQueryFieldToFilterExpression(attrName, expValueKeys, field))
    })

    return [expNames, expValues, filterExp]
}

export default mapQueryToFilterExpressions