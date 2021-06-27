import isISOTimestamp from 'simply-utils/dist/dateTime/isISOTimestamp'

import composeParameterErrMsg from '../helpers/composeParameterErrMsg'

const validateTimestamp = (
  maybeTimestamp: unknown,
  fieldName: string,
): void => {
  if (!isISOTimestamp(maybeTimestamp as string))
    throw new Error(composeParameterErrMsg(fieldName, 'query'))
}

export default validateTimestamp