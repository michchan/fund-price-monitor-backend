import composeParameterErrMsg from '../helpers/composeParameterErrMsg'

const validateCode = (maybeCode: unknown): void => {
  if (!/^[a-z0-9_\-\.]+$/i.test(maybeCode as string))
    throw new Error(composeParameterErrMsg('code', 'path'))
}

export default validateCode