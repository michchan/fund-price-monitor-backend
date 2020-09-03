import { AggregatedRecordType } from "../FundPriceRecord.type"
import getDateTimeDictionary from "src/helpers/getDateTimeDictionary";



const getPeriodByRecordType = (
    recordType: AggregatedRecordType,
    date: Date,
): string => {
    const { week, month, year, quarter } = getDateTimeDictionary(date);

    switch (recordType) {
        case 'week': return `${year}-${month}.${week}`
        case 'month': return `${year}-${month}`
        case 'quarter': return `${year}.${quarter}`
        default:
            throw new Error(`recordType invalid: "${recordType}"`)
    }
}

export default getPeriodByRecordType