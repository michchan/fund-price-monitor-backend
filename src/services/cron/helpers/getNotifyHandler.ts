import { ScheduledHandler } from 'aws-lambda'
import { ScheduleType } from '../helpers/notifyCompanyRecordsByTelegram'
import notifyByTelegram from '../helpers/notifyByTelegram'

export interface EventDetail {
  isForced?: boolean;
}
const getNotifyHandler = (
  scheduleType: ScheduleType
): ScheduledHandler<EventDetail> => async event => {
  const { isForced } = event.detail
  await notifyByTelegram(scheduleType, isForced)
}
export default getNotifyHandler