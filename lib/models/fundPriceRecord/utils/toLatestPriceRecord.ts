import { FundPriceRecord } from "../FundPriceRecord.type"



const toLatestPriceRecord = (record: FundPriceRecord): FundPriceRecord => ({
    ...record,
    recordType: 'latest',
})

export default toLatestPriceRecord