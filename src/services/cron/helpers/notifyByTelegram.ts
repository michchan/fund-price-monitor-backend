import notifyCompanyRecordsByTelegram, { ScheduleType } from './notifyCompanyRecordsByTelegram'
import getTelegramApiCredentials from 'src/helpers/getTelegramApiCredentials'
import forEachCompany from 'src/models/fundPriceRecord/utils/forEachCompany'

const notifyByTelegram = async (scheduleType: ScheduleType): Promise<void> => {
  // Get credentials for sending notifications
  const { chatId, apiKey } = await getTelegramApiCredentials()
  await forEachCompany(
    company => notifyCompanyRecordsByTelegram(chatId, apiKey, company, scheduleType)
  )
}

export default notifyByTelegram