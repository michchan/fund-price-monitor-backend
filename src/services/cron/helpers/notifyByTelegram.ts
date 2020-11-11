import notifyCompanyRecordsByTelegram, { ScheduleType } from './notifyCompanyRecordsByTelegram'
import getTelegramApiCredentials from 'src/helpers/getTelegramApiCredentials'
import forEachCompany from 'src/models/fundPriceRecord/utils/forEachCompany'
import areAllCompanyBatchesAggregated from './areAllCompanyBatchesAggregated'

const notifyByTelegram = async (scheduleType: ScheduleType): Promise<void> => {
  // Get credentials for sending notifications
  const { chatId, apiKey } = await getTelegramApiCredentials()
  await forEachCompany(async (company, i, arr, tableDetails) => {
    const { scrapeMeta } = tableDetails
    const info = scrapeMeta.info[company]
    // * Pick only success case and non-empty case
    if (info?.status === 'success' && Number(info?.size) > 0) {
      const areAllBatchesAggregated = await areAllCompanyBatchesAggregated(tableDetails, company)
      if (areAllBatchesAggregated)
        await notifyCompanyRecordsByTelegram(chatId, apiKey, company, scheduleType)
    }
  })
}

export default notifyByTelegram