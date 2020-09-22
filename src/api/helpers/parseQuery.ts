import { StructuredQuery, StructuredQueryString, MergeType } from "../StructuredQuery.type"



const parseQuery = (q: StructuredQueryString): StructuredQuery => {
    const components = q.split('+');
    return components.reduce((acc, curr) => {
        const [nameAndOpt, value] = curr.split(']');
        const [name, operator] = nameAndOpt.split('[');
        const values = value.replace(/\(|\)/g, '').split(/,|#/)

        return {
            ...acc, 
            [name]: {
                operator,
                value,
                values,
            }
        }
    }, {})
}

export default parseQuery