import { StructuredQuery, StructuredQueryString } from "../StructuredQuery.type"



const parseQuery = (q: StructuredQueryString): StructuredQuery => {
    const components = q.split('+');
    return components.reduce((acc, curr) => {
        const [nameAndOpt, value] = curr.split(']');
        const [name, operator] = nameAndOpt.split('[');

        return {
            ...acc, 
            [name]: {
                operator,
                value: value.split(','),
            }
        }
    }, {})
}

export default parseQuery