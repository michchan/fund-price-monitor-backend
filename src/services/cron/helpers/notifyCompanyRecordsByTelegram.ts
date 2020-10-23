import callPromiseWithDelay from 'simply-utils/dist/async/callPromiseWithDelay'

import {
  CompanyType,
  FundPriceChangeRate,
  FundPriceRecord,
} from 'src/models/fundPriceRecord/FundPriceRecord.type'
import sendMessage from 'src/lib/telegram/sendMessage'
import queryPeriodPriceChangeRate from 'src/models/fundPriceRecord/io/queryPeriodPriceChangeRate'
import getPeriodByRecordType from 'src/models/fundPriceRecord/utils/getPeriodByRecordType'
import queryItemsByCompany from 'src/models/fundPriceRecord/io/queryItemsByCompany'
import parseChangeRate from 'src/models/fundPriceRecord/utils/parseChangeRate'
import parse from 'src/models/fundPriceRecord/utils/parse'
import getSorterByCode from 'src/models/fundPriceRecord/utils/getSorterByCode'
import toTelegramMessages from 'src/models/fundPriceRecord/utils/toTelegramMessages'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const priceChangeRateQueryInput = { shouldQueryAll: true }

export type ScheduleType = 'daily' | 'weekly' | 'monthly' | 'quarterly'
const queryBySchedule = (scheduleType: ScheduleType, company: CompanyType, date: Date) => {
  switch (scheduleType) {
    case 'quarterly': {
      const period = getPeriodByRecordType('quarter', date)
      return queryPeriodPriceChangeRate(company, 'quarter', period, priceChangeRateQueryInput)
    }
    case 'monthly': {
      const period = getPeriodByRecordType('month', date)
      return queryPeriodPriceChangeRate(company, 'month', period, priceChangeRateQueryInput)
    }
    case 'weekly': {
      const period = getPeriodByRecordType('week', date)
      return queryPeriodPriceChangeRate(company, 'week', period, priceChangeRateQueryInput)
    }
    case 'daily':
    default:
      return queryItemsByCompany(company, {
        shouldQueryAll: true,
        shouldQueryLatest: true,
      })
  }
}

const getItemParser = (scheduleType: ScheduleType) => (
  item: DocumentClient.AttributeMap
): FundPriceChangeRate | FundPriceRecord => {
  switch (scheduleType) {
    case 'quarterly':
    case 'monthly':
    case 'weekly':
      return parseChangeRate(item)
    case 'daily':
    default:
      return parse(item)
  }
}

const MESSAGES_INTERVAL = 5000
const notifyCompanyRecordsByTelegram = async (
  chatId: string,
  apiKey: string,
  company: CompanyType,
  scheduleType: ScheduleType,
): Promise<void> => {
  // Create date of latest item
  const date = new Date()

  /** -------- Query and parse records -------- */

  // Query records to be sent in notification
  const queryOutput = await queryBySchedule(scheduleType, company, date)

  // Parse items
  const items = (queryOutput.Items || [])
    .map(getItemParser(scheduleType))
    // Sort by code in ascending order
    .sort(getSorterByCode())

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
      await callPromiseWithDelay(() => Promise.resolve(), MESSAGES_INTERVAL)
  }
}

export default notifyCompanyRecordsByTelegram