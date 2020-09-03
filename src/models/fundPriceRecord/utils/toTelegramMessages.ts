import zeroPadding from "simply-utils/dist/number/zeroPadding";
import capitalize from "lodash/capitalize";

import { FundPriceRecord, CompanyType, FundPriceChangeRate } from "../FundPriceRecord.type"
import { ScheduleType } from "src/cron/helpers/notifyCompanyRecordsByTelegram"
import parseLinesToChunks from "src/lib/telegram/parseLinesToChunks";
import getDateTimeDictionary from "src/helpers/getDateTimeDictionary";



export interface Item extends Pick<FundPriceRecord, 'code' | 'price' | 'name' | 'updatedDate'>, Partial<Pick<FundPriceChangeRate, 'priceChangeRate'>> {}

const toTelegramMessages = (
    company: CompanyType, 
    scheduleType: ScheduleType,
    items: Item[]
): string[] => {
    const date = new Date();
    const { year, month, week, quarter } = getDateTimeDictionary(date);
    const dateOfMonth = zeroPadding(date.getDate(), 2);

    // Derive title line
    const titleLine = `* ------ ${capitalize(scheduleType)} - ${capitalize(company)} - ${year}-${month}-${dateOfMonth} (week: ${week}, Q${quarter}) ------ *`
    // Derive item lines
    const itemLines = items.map(({ code, name, price, priceChangeRate }, i) => {
        const order = `${i + 1}.`
        const codeTag = `__${code}__`
        const priceTag = `*$${Number(price).toFixed(2)}*`
        const priceRateTag = `(${Number(priceChangeRate) > 0 ? `+` : `-`}${Number(priceChangeRate).toFixed(2)}%)`
        
        switch (scheduleType) {
            case 'quarterly':
            case 'monthly':
            case 'weekly':
                return `${order}  ${codeTag}  -  ${priceTag} ${priceRateTag}  -  ${name}`
            case 'daily':
            default:
                return `${order}  ${codeTag}  -  ${priceTag}  -  ${name}`        
        }
    });

    return parseLinesToChunks([titleLine, '', ...itemLines])
}

export default toTelegramMessages