import { ScheduledHandler } from 'aws-lambda'
import { ScheduleType } from 'src/services/cron/helpers/queryItemsBySchedule'
import notify from '../helpers/notify'

export interface EventDetail {
  isForced?: boolean;
}
const getNotifyHandler = (
  scheduleType: ScheduleType
): ScheduledHandler<EventDetail> => async event => {
  const { isForced } = event.detail
  await notify(scheduleType, isForced)
}
export default getNotifyHandler