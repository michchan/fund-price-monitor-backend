import callPromiseWithDelay from 'simply-utils/dist/async/callPromiseWithDelay'

import { CompanyType } from "src/models/fundPriceRecord/FundPriceRecord.type"
import sendMessage from 'src/lib/telegram/sendMessage'
import queryPeriodPriceChangeRate from 'src/models/fundPriceRecord/io/queryPeriodPriceChangeRate'
import getPeriodByRecordType from 'src/models/fundPriceRecord/utils/getPeriodByRecordType'
import queryItemsByCompany from 'src/models/fundPriceRecord/io/queryItemsByCompany'
import parseChangeRate from 'src/models/fundPriceRecord/utils/parseChangeRate'
import parse from 'src/models/fundPriceRecord/utils/parse'
import getSorterByCode from 'src/models/fundPriceRecord/utils/getSorterByCode'
import toTelegramMessages from 'src/models/fundPriceRecord/utils/toTelegramMessages'



export type ScheduleType = 'daily' | 'weekly' | 'monthly' | 'quarterly'

const notifyCompanyRecordsByTelegram = async (
    chatId: string,
    apiKey: string,
    company: CompanyType,
    scheduleType: ScheduleType,
) => {
    // Create date of latest item
    const date = new Date()
    
    /** -------- Query and parse records  -------- */
    
    // query records to be sent in notification
    const queryOutput = await ((scheduleType: ScheduleType) => {
        switch (scheduleType) {
            case 'quarterly':
                return queryPeriodPriceChangeRate(company, 'quarter', getPeriodByRecordType('quarter', date), true)
            case 'monthly':
                return queryPeriodPriceChangeRate(company, 'month', getPeriodByRecordType('month', date), true)
            case 'weekly':
                return queryPeriodPriceChangeRate(company, 'week', getPeriodByRecordType('week', date), true)
            case 'daily':
            default:
                return queryItemsByCompany(company, true, true)
        }
    })(scheduleType)

    // Parse items
    const items = (queryOutput.Items || []).map(item => {
        switch (scheduleType) {
            case 'quarterly':
            case 'monthly':
            case 'weekly':
                return parseChangeRate(item)
            case 'daily':
            default:
                return parse(item)
        }
    // Sort by code in ascending order
    }).sort(getSorterByCode())
    
    // Abort if no items found
    if (items.length === 0) {
        console.log('No items found')
        return 
    }
    
    /** -------- Transform records to messages and send messages -------- */

    // Parse items as telegram messages
    const messages = toTelegramMessages(company, scheduleType, items)

    // Send each chunk of messages
    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i]
        await sendMessage(chatId, apiKey, msg)

        if (i < messages.length)
            // Delay to make sure the previous message has been sent and displayed to all user
            await callPromiseWithDelay((async () => null), 5000)
    }
}

export default notifyCompanyRecordsByTelegram