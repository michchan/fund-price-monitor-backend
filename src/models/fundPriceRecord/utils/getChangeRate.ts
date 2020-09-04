import { FundPriceRecord, FundPriceChangeRate, AggregatedRecordType } from "../FundPriceRecord.type";
import getPeriodByRecordType from "./getPeriodByRecordType";
import calculatePriceChangeRate from "./calculatePriceChangeRate";


const getChangeRate = (
    record: FundPriceRecord | FundPriceChangeRate, 
    recordType: AggregatedRecordType,
    prevPriceList: number[] = [],
    priceListMode: 'append' | 'prepend' = 'prepend',
    aggregateDate?: Date,
): FundPriceChangeRate => {
    // Get date from record time
    const date = new Date(record.time);

    // Get next price list
    const priceList = priceListMode === 'prepend' 
        ? [...prevPriceList, +record.price]
        : [+record.price, ...prevPriceList]

    const startPrice = priceList[0]
    const endPrice = priceList[priceList.length - 1]
    // Calculate change rate
    const priceChangeRate = calculatePriceChangeRate(startPrice, endPrice)
    
    return {
        recordType,
        period: getPeriodByRecordType(recordType, date),
        company: record.company,
        code: record.code,
        name: record.name,
        updatedDate: record.updatedDate,
        price: record.price,
        priceChangeRate,
        priceList,
        time: (aggregateDate ?? new Date()).toISOString(),
    }
}

export default getChangeRate