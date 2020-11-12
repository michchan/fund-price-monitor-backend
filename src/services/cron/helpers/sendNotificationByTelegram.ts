import callPromiseWithDelay from 'simply-utils/dist/async/callPromiseWithDelay'

import { CompanyType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import sendMessage from 'src/lib/telegram/sendMessage'
import toTelegramMessages from 'src/models/fundPriceRecord/utils/toTelegramMessages'
import { ItemType, ScheduleType } from './queryItemsBySchedule'
import { Output as CredentialOutput } from 'src/helpers/getTelegramApiCredentials'

const MESSAGES_INTERVAL = 5000
const sendNotificationByTelegram = async (
  { apiKey, chatId }: CredentialOutput,
  company: CompanyType,
  scheduleType: ScheduleType,
  items: ItemType[],
): Promise<void> => {
  // Abort if no items found
  if (items.length === 0) {
    console.log('No items found')
    return
  }
  // Parse items as telegram messages
  const messages = toTelegramMessages(company, scheduleType, items)
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