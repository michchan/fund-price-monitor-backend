import { ScheduledHandler } from 'aws-lambda'

/**
 * De-duplications of records
 */
export const handler: ScheduledHandler = async (event, context, callback) => {
  try {
    await Promise.resolve()
  } catch (error) {
    callback(error)
  }
}