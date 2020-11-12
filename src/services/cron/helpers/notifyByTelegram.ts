import notifyCompanyRecordsByTelegram, { ScheduleType } from './notifyCompanyRecordsByTelegram'
import getTelegramApiCredentials from 'src/helpers/getTelegramApiCredentials'
import forEachCompany from 'src/models/fundPriceRecord/utils/forEachCompany'
import areAllCompanyBatchesAggregated from './areAllCompanyBatchesAggregated'

const notifyByTelegram = async (scheduleType: ScheduleType, isForced?: boolean): Promise<void> => {
  // Get credentials for sending notifications
  const { chatId, apiKey } = await getTelegramApiCredentials()
  await forEachCompany(async (company, i, arr, tableDetails) => {
    const comMeta = (tableDetails.scrapeMeta?.info ?? {})[company]
    const shouldSkipCheck = (
      isForced
      // Always pass to execute notification for any scheduleType except 'onUpdate'
      || scheduleType !== 'onUpdate'
    )
    const shouldNotify = (
      shouldSkipCheck
      // Pass 'false' to discard empty size (but successful) case
      || (
        // Make sure it has not been notified for that changes
        !comMeta?.isNotified
        && await areAllCompanyBatchesAggregated(tableDetails, company, false)
      )
    )
    if (shouldNotify) await notifyCompanyRecordsByTelegram(chatId, apiKey, company, scheduleType)
  })
}

export default notifyByTelegram