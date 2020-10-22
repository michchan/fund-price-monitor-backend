import isValidCompany from 'src/models/fundPriceRecord/utils/isValidCompany'

import createParameterErrMsg from '../helpers/createParameterErrMsg'

const validateCompany = (maybeCompany: unknown): void => {
  if (!isValidCompany(maybeCompany as string))
    throw new Error(createParameterErrMsg('company', 'path'))
}

export default validateCompany