import { FundPriceRecord } from "../FundPriceRecord.type"



const toLatestPriceRecord = (record: FundPriceRecord, date?: Date): FundPriceRecord => ({
    ...record,
    time: date ? date.toISOString() : record.time,
    recordType: 'latest',
})

export default toLatestPriceRecord