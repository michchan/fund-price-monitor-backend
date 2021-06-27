import isValidCompany from 'src/models/fundPriceRecord/utils/isValidCompany'

import composeParameterErrMsg from '../helpers/composeParameterErrMsg'

const validateCompany = (maybeCompany: unknown): void => {
  if (!isValidCompany(maybeCompany as string))
    throw new Error(composeParameterErrMsg('company', 'path'))
}

export default validateCompany