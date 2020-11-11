import notifyCompanyRecordsByTelegram, { ScheduleType } from './notifyCompanyRecordsByTelegram'
import getTelegramApiCredentials from 'src/helpers/getTelegramApiCredentials'
import forEachCompany from 'src/models/fundPriceRecord/utils/forEachCompany'
import areAllCompanyBatchesAggregated from './areAllCompanyBatchesAggregated'

const notifyByTelegram = async (scheduleType: ScheduleType): Promise<void> => {
  // Get credentials for sending notifications
  const { chatId, apiKey } = await getTelegramApiCredentials()
  await forEachCompany(async (company, i, arr, tableDetails) => {
    // Pass 'false' to discard empty size (but successful) case
    const areAggregated = await areAllCompanyBatchesAggregated(tableDetails, company, false)
    if (areAggregated)
      await notifyCompanyRecordsByTelegram(chatId, apiKey, company, scheduleType)
  })
}

export default notifyByTelegram