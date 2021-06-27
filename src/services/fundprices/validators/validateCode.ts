import composeParameterErrMsg from '../helpers/composeParameterErrMsg'
import createParameterError from '../helpers/createParameterError'

const validateCode = (maybeCode: unknown): void => {
  if (!/^[a-z0-9_\-\.]+$/i.test(maybeCode as string))
    throw createParameterError(composeParameterErrMsg('code', 'path'))
}

export default validateCode