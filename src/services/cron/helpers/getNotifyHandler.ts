import { ScheduledHandler } from 'aws-lambda'
import { ScheduleType } from 'src/services/cron/helpers/queryItemsBySchedule'
import notifyAll from '../helpers/notifyAll'

export interface EventDetail {
  isForced?: boolean;
}
const getNotifyHandler = (
  scheduleType: ScheduleType
): ScheduledHandler<EventDetail> => async () => {
  await notifyAll(scheduleType)
}
export default getNotifyHandler