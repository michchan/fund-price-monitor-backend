import pipeAsync from 'simply-utils/dist/async/pipeAsync'

import notifyCompanyRecordsByTelegram, { ScheduleType } from './notifyCompanyRecordsByTelegram'
import getTelegramApiCredentials from 'src/helpers/getTelegramApiCredentials'
import getTableDetails from 'src/models/fundPriceRecord/io/getTableDetails'

const notifyByTelegram = async (scheduleType: ScheduleType): Promise<void> => {
  /** -------- Get credentials for sending notifications -------- */
  const { chatId, apiKey } = await getTelegramApiCredentials()

  /** -------- Get list of companies -------- */
  // Get from table-level "details" record
  const { companies } = await getTableDetails()

  /** -------- Notify for each company -------- */
  await pipeAsync(...companies.map(
    company => () => notifyCompanyRecordsByTelegram(chatId, apiKey, company, scheduleType)
  ))()
}

export default notifyByTelegram