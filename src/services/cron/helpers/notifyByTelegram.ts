import notifyCompanyRecordsByTelegram, { ScheduleType } from './notifyCompanyRecordsByTelegram'
import getTelegramApiCredentials from 'src/helpers/getTelegramApiCredentials'
import getTableDetails from 'src/models/fundPriceRecord/io/getTableDetails'

const notifyByTelegram = async (
  scheduleType: ScheduleType
) => {
  /** -------- Get credentials for sending notifications -------- */
  const { chatId, apiKey } = await getTelegramApiCredentials()

  /** -------- Get list of companies -------- */
  // Get from table-level "details" record
  const { companies } = await getTableDetails()

  /** -------- Notify for each company -------- */
  for (const company of companies) {
    // Notify to telegram channel
    await notifyCompanyRecordsByTelegram(chatId, apiKey, company, scheduleType)
  }
}

export default notifyByTelegram