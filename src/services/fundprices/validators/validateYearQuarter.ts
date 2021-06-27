import composeParameterErrMsg from '../helpers/composeParameterErrMsg'
import createParameterError from '../helpers/createParameterError'

const validateYearQuarter = (
  maybeYearQuarter: unknown,
  name: string,
): void => {
  if (!/^([0-9]{4})\.[1-4]$/.test(maybeYearQuarter as string))
    throw createParameterError(composeParameterErrMsg(name, 'query'))
}
export default validateYearQuarter