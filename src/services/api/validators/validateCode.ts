import createParameterErrMsg from '../helpers/createParameterErrMsg'

const validateCode = (maybeCode: unknown): void => {
  if (!/^[a-z0-9_\-\.]+$/i.test(maybeCode as string)) 
    throw new Error(createParameterErrMsg('code', 'path'))
}

export default validateCode