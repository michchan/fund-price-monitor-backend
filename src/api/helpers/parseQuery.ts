import { StructuredQuery, StructuredQueryString, MergeType } from "../StructuredQuery.type"



const parseQuery = (q: StructuredQueryString): StructuredQuery => {
    const components = q.split('+');
    return components.reduce((acc, curr) => {
        const [nameAndOpt, value] = curr.split(']');
        const [name, operator] = nameAndOpt.split('[');
        const values = value.split(/,|#/)
        const mergeType: MergeType = value.includes('#') ? 'intersect' : 'union'

        return {
            ...acc, 
            [name]: {
                operator,
                value: values.length <= 1 ? values[0] : values,
                mergeType,
            }
        }
    }, {})
}

export default parseQuery