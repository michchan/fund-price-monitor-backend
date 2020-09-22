import { StructuredQuery, StructuredQueryString } from "../StructuredQuery.type"



const parseQuery = (q: StructuredQueryString): StructuredQuery => {
    const components = q.split('+');
    return components.reduce((acc, curr) => {
        const [nameAndOpt, value] = curr.split(']');
        const [name, operator] = nameAndOpt.split('[');
        const values = value.split(',')

        return {
            ...acc, 
            [name]: {
                operator,
                value: values.length <= 1 ? values[0] : values,
            }
        }
    }, {})
}

export default parseQuery