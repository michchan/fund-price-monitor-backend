import isISOTimestamp from 'simply-utils/dist/dateTime/isISOTimestamp'

import composeParameterErrMsg from '../helpers/composeParameterErrMsg'
import createParameterError from '../helpers/createParameterError'

const validateTimestamp = (
  maybeTimestamp: unknown,
  fieldName: string,
): void => {
  if (!isISOTimestamp(maybeTimestamp as string))
    throw createParameterError(composeParameterErrMsg(fieldName, 'query'))
}

export default validateTimestamp