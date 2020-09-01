import zeroPadding from "simply-utils/dist/number/zeroPadding";
import getWeekOfYear from "simply-utils/dist/dateTime/getWeekOfYear";

import { FundPriceRecord, FundPriceChangeRate, AggregatedRecordType } from "../FundPriceRecord.type";
import getQuarter from "lib/helpers/getQuarter";



const getChangeRate = (
    record: FundPriceRecord | FundPriceChangeRate, 
    recordType: AggregatedRecordType,
    prevPriceList: number[] = [],
    priceListMode: 'append' | 'prepend' = 'prepend',
    aggregateDate?: Date,
): FundPriceChangeRate => {
    // Get date from record time
    const date = new Date(record.time);
    // Get year
    const year = date.getFullYear();
    // Get month
    const month = zeroPadding(date.getMonth() + 1, 2);
    // Get week
    const week = getWeekOfYear(date);
    // Get quarter
    const quarter = getQuarter(date);

    // Get next price list
    const priceList = priceListMode === 'prepend' 
        ? [...prevPriceList, record.price]
        : [record.price, ...prevPriceList]

    // Calculate change rate
    const priceChangeRate = priceList[priceList.length - 1] -priceList[0]
    
    return {
        recordType,
        period: (() => {
            switch (recordType) {
                case 'week': return `${year}-${month}.${week}`
                case 'month': return `${year}-${month}`
                case 'quarter': return `${year}.${quarter}`
                default:
                    throw new Error(`recordType invalid: "${recordType}"`)
                    return ''
            }
        })(),
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