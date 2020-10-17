import { ScheduledHandler } from "aws-lambda"
import notifyByTelegram from "../helpers/notifyByTelegram"


/** 
 * Send notification messages upon data updates
 */
export const handler: ScheduledHandler = async (event, context, callback) => {
  try {
    await notifyByTelegram('weekly')
  } catch (error) {
    callback(error)
  }
}
