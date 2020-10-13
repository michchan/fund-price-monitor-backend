import { FundPriceRecord } from "../FundPriceRecord.type"



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


/** Get time difference in milliseconds by Period */
const getDiffMSByPeriod = (period: Period): number => {
    switch (period) {
        case 'week': return 1000 * 60 * 60 * 24 * 7 // 1s -> 1min -> 1hrs -> 24hrs -> 7days
        case 'month': return 1000 * 60 * 60 * 24 * 30 // 1s -> 1min -> 1hrs -> 24hrs -> 30days
        case 'quarter': return 1000 * 60 * 60 * 24 * 30 * 3 // 1s -> 1min -> 1hrs -> 24hrs -> 30days -> 3months
        default:
            return 0
    }
}