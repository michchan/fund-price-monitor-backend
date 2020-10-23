import { FundPriceRecord } from '../FundPriceRecord.type'

const SEVEN_DAYS_IN_MS = 604800000
const THIRTY_DAYS_IN_MS = 2592000000
const THREE_MONTHS_IN_MS = 7776000000

/** Get time difference in milliseconds by Period */
const getDiffMSByPeriod = (period: Period): number => {
  switch (period) {
    case 'week': return SEVEN_DAYS_IN_MS
    case 'month': return THIRTY_DAYS_IN_MS
    case 'quarter': return THREE_MONTHS_IN_MS
    default:
      return 0
  }
}

export type Period = 'week' | 'month' | 'quarter'
/**
 *
 * @param referenceRecord
 * @param period
 *
 * @returns The ISO timestamp of the start time to query
 */
const getQueryStartTimeByPeriodDifference = (
  referenceRecord: FundPriceRecord,
  period: Period,
): string => {
  // Get reference date object
  const refDate = new Date(referenceRecord.time)
  // Get the difference of time
  const diffMS = getDiffMSByPeriod(period)
  // Get the timestamp to query from
  const startTime = refDate.getTime() - diffMS

  return new Date(startTime).toISOString()
}
export default getQueryStartTimeByPeriodDifference