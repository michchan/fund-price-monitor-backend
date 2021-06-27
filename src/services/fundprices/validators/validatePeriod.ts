import { AggregatedRecordType } from '@michchan/fund-price-monitor-lib'
import composeParameterErrMsg from '../helpers/composeParameterErrMsg'
import createParameterError from '../helpers/createParameterError'

const validatePeriod = (
  maybePeriod: unknown,
  type: AggregatedRecordType
): void => {
  const throwErr = () => {
    throw createParameterError(composeParameterErrMsg(type, 'path'))
  }

  switch (type) {
    case 'week':
      // `YYYY-MM.nthWeek` or `YYYY.nthWeek`
      if (!/^[0-9]{4}(-((0[0-9])|(1[0-2])))?\.[0-9]+$/.test(maybePeriod as string)) throwErr()
      break
    case 'month':
      // `YYYY-MM`
      if (!/^[0-9]{4}-((0[0-9])|(1[0-2]))$/.test(maybePeriod as string)) throwErr()
      break
    case 'quarter':
      // `YYYY.nthQuarter`
      if (!/^[0-9]{4}\.[1-4]$/.test(maybePeriod as string)) throwErr()
      break
    default:
      break
  }
}

export default validatePeriod