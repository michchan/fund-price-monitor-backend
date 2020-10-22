import capitalize from 'lodash/capitalize'

import { Operator, StructuredQuery, StructuredQueryField, StructuredQueryString } from '../StructuredQuery.type'

const parseQuery = (q: StructuredQueryString): StructuredQuery => {
  const components = q.split('+')
  return components.reduce((acc, curr) => {
    const [nameAndOpt, value] = curr.split(']')
    const [name, _operator] = nameAndOpt.split('[')

    const operator = _operator as Operator
    const values = value
      .replace(/\(|\)/g, '')
      .split(/,|#/)
      // Each value will have three casing variants
      .reduce((acc, curr) => {
        const caseVariants = ['inc', 'notinc'].includes(operator) ? [
          capitalize(curr),
          curr.toLowerCase(),
          curr.toUpperCase(),
        ] : [curr]

        return [...acc, ...caseVariants]
      }, [] as string[])

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