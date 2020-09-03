import { ScheduledHandler } from "aws-lambda"
import getTelegramApiCredentials from "src/helpers/getTelegramApiCredentials"



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
        
        console.log({ telegramChatId, telegramApiKey });

    } catch (error) {
        callback(error)
    }
}