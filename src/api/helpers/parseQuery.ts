import { StructuredQuery, StructuredQueryString, StructuredQueryField, Operator } from "../StructuredQuery.type"



const parseQuery = (q: StructuredQueryString): StructuredQuery => {
    const components = q.split('+');
    return components.reduce((acc, curr) => {
        const [nameAndOpt, value] = curr.split(']');
        const [name, operator] = nameAndOpt.split('[');
        const values = value.replace(/\(|\)/g, '').split(/,|#/)

        const field: StructuredQueryField = {
            name,
            operator: operator as Operator,
            value,
            values,
        }

        return [...acc, field]
    }, [] as StructuredQuery)
}

export default parseQuery