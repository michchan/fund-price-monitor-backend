import callPromiseWithDelay from 'simply-utils/dist/async/callPromiseWithDelay'

import FundPriceRecord, { CompanyType, FundType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import sendMessage from 'src/lib/telegram/sendMessage'
import toTelegramMessages from 'src/models/fundPriceRecord/utils/toTelegramMessages'
import { ScheduleType } from './queryItemsBySchedule'
import { Output as CredentialOutput } from 'src/helpers/getTelegramApiCredentials'
import FundPriceChangeRate from 'src/models/fundPriceRecord/FundPriceChangeRate.type'

interface ItemDetails {
  name: string;
}
export type Item =
  | (FundPriceChangeRate<FundType> & ItemDetails)
  | (FundPriceRecord<FundType> & ItemDetails)

const MESSAGES_INTERVAL = 5000

export interface Options {
  credentials: CredentialOutput;
  company: CompanyType;
  scheduleType: ScheduleType;
  items: Item[];
  emphasizedItems?: Item['code'][];
}

const sendNotificationByTelegram = async ({
  credentials: { apiKey, chatId },
  company,
  scheduleType,
  items,
  emphasizedItems = [],
}: Options): Promise<void> => {
  // Abort if no items found
  if (items.length === 0) {
    console.log('No items found')
    return
  }
  // Parse items as telegram messages
  const messages = toTelegramMessages(company, scheduleType, items, emphasizedItems)
  // Send each chunk of messages
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    await sendMessage(chatId, apiKey, msg)

    if (i < messages.length)
      // Delay to make sure the previous message has been sent and displayed to all user
      await callPromiseWithDelay(() => Promise.resolve(), MESSAGES_INTERVAL)
  }
}

export default sendNotificationByTelegram