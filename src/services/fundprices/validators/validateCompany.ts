import isValidCompany from 'src/models/fundPriceRecord/utils/isValidCompany'

import composeParameterErrMsg from '../helpers/composeParameterErrMsg'
import createParameterError from '../helpers/createParameterError'

const validateCompany = (maybeCompany: unknown): void => {
  if (!isValidCompany(maybeCompany as string))
    throw createParameterError(composeParameterErrMsg('company', 'path'))
}

export default validateCompany