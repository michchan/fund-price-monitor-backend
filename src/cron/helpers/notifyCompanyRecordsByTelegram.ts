import callPromiseWithDelay from 'simply-utils/dist/async/callPromiseWithDelay'

import fundPriceRecord from "src/models/fundPriceRecord";
import { CompanyType } from "src/models/fundPriceRecord/FundPriceRecord.type";
import telegram from 'src/lib/telegram';



export type ScheduleType = 'daily' | 'weekly' | 'monthly' | 'quarterly'

const notifyCompanyRecordsByTelegram = async (
    chatId: string,
    apiKey: string,
    company: CompanyType,
    scheduleType: ScheduleType,
) => {
    // Create date of latest item
    const date = new Date();
    
    /** -------- Query and parse records  -------- */
    
    // query records to be sent in notification
    const queryOutput = await ((scheduleType: ScheduleType) => {
        switch (scheduleType) {
            case 'quarterly':
                return fundPriceRecord.queryPeriodPriceChangeRate(company, 'quarter', fundPriceRecord.getPeriodByRecordType('quarter', date));
            case 'monthly':
                return fundPriceRecord.queryPeriodPriceChangeRate(company, 'month', fundPriceRecord.getPeriodByRecordType('month', date));
            case 'weekly':
                return fundPriceRecord.queryPeriodPriceChangeRate(company, 'week', fundPriceRecord.getPeriodByRecordType('week', date));
            case 'daily':
            default:
                return fundPriceRecord.queryItemsByCompany(company, true);
        }
    })(scheduleType);

    // Parse items
    const items = (queryOutput.Items || []).map(item => {
        switch (scheduleType) {
            case 'quarterly':
            case 'monthly':
            case 'weekly':
                return fundPriceRecord.parseChangeRate(item);
            case 'daily':
            default:
                return fundPriceRecord.parse(item);
        }
    // Sort by code in ascending order
    }).sort(fundPriceRecord.getSorterByCode());
    
    // Abort if no items found
    if (items.length === 0) {
        console.log('No items found');
        return 
    }
    
    /** -------- Transform records to messages and send messages -------- */

    // Parse items as telegram messages
    const messages = fundPriceRecord.toTelegramMessages(company, scheduleType, items);

    // Send each chunk of messages
    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        await telegram.sendMessage(chatId, apiKey, msg);

        if (i < messages.length)
            await callPromiseWithDelay((async () => null), 5000);
    }
}

export default notifyCompanyRecordsByTelegram