import composeParameterErrMsg from '../helpers/composeParameterErrMsg'
import createParameterError from '../helpers/createParameterError'

const validateEnum = <T extends string>(value: T, fieldName: string, values: T[]): void => {
  const isValid = values.includes(value)
  if (!isValid)
    throw createParameterError(composeParameterErrMsg(fieldName, 'query', 'invalid'))
}

export default validateEnum