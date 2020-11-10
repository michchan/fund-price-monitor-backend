import { ScheduledHandler } from 'aws-lambda'
import notifyByTelegram from '../helpers/notifyByTelegram'

/**
 * Send notification messages upon data updates
 */
export const handler: ScheduledHandler = async () => {
  await notifyByTelegram('onUpdate')
}