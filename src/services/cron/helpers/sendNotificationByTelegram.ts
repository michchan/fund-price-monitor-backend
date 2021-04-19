import sendTelegramMessages from 'simply-utils/dist/telegram/sendTelegramMessages'
import { FundPriceRecord, FundPriceChangeRate, CompanyType, FundType } from '@michchan/fund-price-monitor-lib'

import toTelegramMessageLines from 'src/models/fundPriceRecord/utils/toTelegramMessageLines'
import { ScheduleType } from './queryItemsBySchedule'
import { Output as CredentialOutput } from 'src/helpers/getTelegramApiCredentials'

interface ItemDetails {
  name: string;
}
export type Item =
  | (FundPriceChangeRate<FundType> & ItemDetails)
  | (FundPriceRecord<FundType> & ItemDetails)

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
  const lines = toTelegramMessageLines(company, scheduleType, items, emphasizedItems)
  await sendTelegramMessages(lines, chatId, apiKey)
}

export default sendNotificationByTelegram