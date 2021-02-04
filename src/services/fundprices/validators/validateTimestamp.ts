import isISOTimestamp from 'simply-utils/dist/dateTime/isISOTimestamp'

import createParameterErrMsg from '../helpers/createParameterErrMsg'

const validateTimestamp = (
  maybeTimestamp: unknown,
  fieldName: string,
): void => {
  if (!isISOTimestamp(maybeTimestamp as string))
    throw new Error(createParameterErrMsg(fieldName, 'query'))
}

export default validateTimestamp