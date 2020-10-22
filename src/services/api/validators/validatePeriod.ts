import createParameterErrMsg from '../helpers/createParameterErrMsg'

export type PeriodType = 'week' | 'month' | 'quarter'

const validatePeriod = (
  maybePeriod: unknown,
  type: PeriodType
): void => {
  const throwErr = () => { throw new Error(createParameterErrMsg(type, 'path')) }

  switch (type) {
    case 'week':
      if (!/^[0-9]{4}-((0[0-9])|(1[1-2]))\.[0-9]+$/.test(maybePeriod as string)) throwErr()
      break
    case 'month':
      if (!/^[0-9]{4}-((0[0-9])|(1[1-2]))$/.test(maybePeriod as string)) throwErr()
      break
    case 'quarter':
      if (!/^[0-9]{4}\.[1-4]$/.test(maybePeriod as string)) throwErr()
      break
    default:
      break
  }
}

export default validatePeriod