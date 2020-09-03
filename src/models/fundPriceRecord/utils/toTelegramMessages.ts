import { FundPriceRecord, CompanyType, FundPriceChangeRate } from "../FundPriceRecord.type"
import { ScheduleType } from "src/cron/helpers/notifyCompanyRecordsByTelegram"



export interface Item extends Pick<FundPriceRecord, 'code' | 'price' | 'name' | 'updatedDate'>, Partial<Pick<FundPriceChangeRate, 'priceChangeRate'>> {}

const toTelegramMessages = (
    company: CompanyType, 
    scheduleType: ScheduleType,
    items: Item[]
): string[] => {
    const titleLine = `* ------ ${scheduleType.toUpperCase()} - ${company.toUpperCase()} ------ *`
    const itemLines = items.map(({ code, name, price, priceChangeRate }, i) => {
        const priceTag = `$${Number(price).toFixed(2)}`
        const priceRateTag = `(${Number(priceChangeRate) > 0 ? `+` : `-`}${Number(priceChangeRate).toFixed(2)}%)`
        const order = `${i + 1}.`
        
        switch (scheduleType) {
            case 'quarterly':
            case 'monthly':
            case 'weekly':
                return [order, code, name, priceTag, priceRateTag].join(' ');
            case 'daily':
            default:
                return [order, code, name, priceTag].join(' ');
        }
    });

    return [
        [titleLine, ...itemLines].join('\n'),
    ]
}

export default toTelegramMessages