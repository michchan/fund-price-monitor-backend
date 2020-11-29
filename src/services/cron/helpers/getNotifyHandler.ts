import { ScheduledHandler } from 'aws-lambda'
import logObj from 'src/helpers/logObj'
import { CompanyType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import { ScheduleType } from 'src/services/cron/helpers/queryItemsBySchedule'
import notifyAll, { OverridingItemsDict } from '../helpers/notifyAll'

export interface EventDetail {
  companyWhitelist?: CompanyType[];
  overridingItemsDict?: OverridingItemsDict;
}
const getNotifyHandler = (
  scheduleType: ScheduleType
): ScheduledHandler<EventDetail> => async event => {
  const { companyWhitelist, overridingItemsDict } = event.detail || {}
  logObj('Event: ', event)
  await notifyAll(scheduleType, companyWhitelist, overridingItemsDict)
}
export default getNotifyHandler