import notifyCompanyRecordsByTelegram, { ScheduleType } from "./notifyCompanyRecordsByTelegram";
import getTelegramApiCredentials from "src/helpers/getTelegramApiCredentials";
import { CompanyType } from "src/models/fundPriceRecord/FundPriceRecord.type";
import fundPriceRecord from "src/models/fundPriceRecord";



const notifyByTelegram = async (
    scheduleType: ScheduleType
) => {
    /** -------- Get credentials for sending notifications  -------- */
    const { chatId, apiKey } = await getTelegramApiCredentials();

    /** -------- Get list of companies  -------- */

    // Get from table-level "details" record
    const { companies } = await fundPriceRecord.getTableDetails();

    /** -------- Notify for each company  -------- */
    for (const company of companies) {
        // Notify to telegram channel
        await notifyCompanyRecordsByTelegram(chatId, apiKey, company, scheduleType);
    }
}

export default notifyByTelegram