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
    const titleLine = `* ------ ${capitalize(scheduleType)} - ${capitalize(company)} - ${year}-${month}-${dateOfMonth} (week: ${week}, Q${quarter}) ------ *`;
    // Derive item lines
    const itemLines = items.map(({ code, name, price, priceChangeRate = 0 }, i) => {
        const order = `${i + 1}.`
        const codeTag = `__${code}__`
        const priceTag = `*$${Number(price).toFixed(2)}*`

        const rate = Number(priceChangeRate)
        const rateTag = rate.toFixed(2)
        const sign = +rate === 0 ? '' : +rate > 0 ? `+` : `-`
        const priceRateTag = `(${sign}${rateTag}%)`
        
        return `${order}  ${codeTag}  -  ${priceTag} ${priceRateTag}  -  ${name}`
    });

    return parseLinesToChunks([titleLine, '', ...itemLines])
}

export default toTelegramMessages