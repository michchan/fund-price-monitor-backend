import composeParameterErrMsg from '../helpers/composeParameterErrMsg'
import getYearQuarterFromTimestamp from '../helpers/getYearQuarterFromTimestamp'

/**
 * StartTime and endTime must be within a certain quarter
 *
 * @param startTime
 * @param endTime
 */
const validateTimestampRange = (
  startTime: string,
  endTime: string,
  [startTimeName, endTimeName]: [string, string],
): void => {
  const start = getYearQuarterFromTimestamp(startTime)
  const end = getYearQuarterFromTimestamp(endTime)

  if (start !== end) {
    throw new Error(composeParameterErrMsg(
      `${startTimeName}\', \'${endTimeName}`,
      'query',
      'custom',
      'must be within the same quarter'
    ))
  }
}

export default validateTimestampRange