import { DynamoDB } from "aws-sdk"
import mapValues from "lodash/mapValues"


export const mapRawAttribute = (attribute: DynamoDB.AttributeValue): any => mapValues(attribute, (value, key: keyof DynamoDB.AttributeValue): any => {
    switch (key) {
        case 'M':
            return mapRawAttributes(value as DynamoDB.MapAttributeValue);
        case 'L':
            return (value as DynamoDB.ListAttributeValue).map(listAttr => mapRawAttribute(listAttr))
        case 'NS':
            return (value as DynamoDB.NumberSetAttributeValue).map(val => +val);
        case 'NULL': 
            return null
        case 'BOOL':
            return Boolean(value)
        case 'N':
            return Number(value)
        case 'BS':
        case 'SS':
        case 'B':
        case 'S':
        default: 
            return value
    }
})

const mapRawAttributes = (attributesMap: DynamoDB.AttributeMap): DynamoDB.DocumentClient.AttributeMap => {
    return mapValues(attributesMap, attribute => mapRawAttribute(attribute))
}

export default mapRawAttributes