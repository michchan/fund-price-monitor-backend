import zeroPadding from "simply-utils/dist/number/zeroPadding";
import getWeekOfYear from "simply-utils/dist/dateTime/getWeekOfYear";
import getQuarter from "simply-utils/dist/dateTime/getQuarter";

import { FundPriceRecord, FundPriceChangeRate, AggregatedRecordType } from "../FundPriceRecord.type";
import getPeriodByRecordType from "./getPeriodByRecordType";


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

    // Calculate change rate
    const priceChangeRate = priceList[priceList.length - 1] - priceList[0]
    
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