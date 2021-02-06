import createParameterErrMsg from '../helpers/createParameterErrMsg'

const validateYearQuarter = (
  maybeYearQuarter: unknown,
  name: string,
): void => {
  if (!/^([0-9]{4})\.[1-4]$/.test(maybeYearQuarter as string))
    throw new Error(createParameterErrMsg(name, 'query'))
}
export default validateYearQuarter