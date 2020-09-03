import { ScheduledHandler } from "aws-lambda"

import getTelegramApiCredentials from "src/helpers/getTelegramApiCredentials"
import fundPriceRecord from "src/models/fundPriceRecord";


/** 
 * Send notification messages upon data updates
 */
export const handler: ScheduledHandler = async (event, context, callback) => {
    try {
        /** -------- Get credentials for sending notifications  -------- */
        const {
            chatId: telegramChatId,
            apiKey: telegramApiKey,
        } = await getTelegramApiCredentials();

        /** -------- Query records  -------- */
        const queryOutput = await fundPriceRecord.queryLatestItemsByCompany('manulife');
        
        console.log(`CREDENTIALS: ${JSON.stringify({ telegramChatId, telegramApiKey }, null, 2)}`);
        console.log(JSON.stringify(queryOutput, null, 2));

    } catch (error) {
        callback(error)
    }
}