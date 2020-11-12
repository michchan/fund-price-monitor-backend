import isISOTimestamp from 'simply-utils/dist/dateTime/isISOTimestamp'

import sendNotificationByTelegram from './sendNotificationByTelegram'
import getTelegramApiCredentials from 'src/helpers/getTelegramApiCredentials'
import forEachCompany from 'src/models/fundPriceRecord/utils/forEachCompany'
import areAllCompanyBatchesAggregated from './areAllCompanyBatchesAggregated'
import getDateTimeDictionary from 'src/helpers/getDateTimeDictionary'
import saveScrapeMetadata from 'src/models/fundPriceRecord/utils/saveScrapeMetadata'
import FundPriceTableDetails, { CompanyScrapeMeta, ScrapeMeta } from 'src/models/fundPriceRecord/FundPriceTableDetails.type'
import { CompanyType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import { defaultCompanyScrapeMeta } from 'src/models/fundPriceRecord/constants/defaultScrapeMeta'
import queryItemsBySchedule, { ScheduleType } from './queryItemsBySchedule'

interface ShouldNotifyOptions {
  isNotified?: boolean;
  time?: ScrapeMeta['time'];
  isForced?: boolean;
}
const shouldNotify = (
  scheduleType: ScheduleType,
  company: CompanyType,
  tableDetails: FundPriceTableDetails,
  { isNotified, time, isForced }: ShouldNotifyOptions = {},
) => {
  const shouldSkipCheck = (
    isForced
    // Always pass to execute notification for any scheduleType except 'onUpdate'
    || scheduleType !== 'onUpdate'
  )
  return (
    shouldSkipCheck
    // Pass 'false' to discard empty size (but successful) case
    || (
      // Make sure it has not been notified for that changes
      !isNotified
      && isISOTimestamp(time ?? '')
      && areAllCompanyBatchesAggregated(tableDetails, company, false)
    )
  )
}

const saveMetaAfterNotify = async (
  company: CompanyType,
  companyScrapeMeta: CompanyScrapeMeta,
  time?: ScrapeMeta['time'],
) => {
  const date = time ? new Date(time) : new Date()
  const tableRange = getDateTimeDictionary(date)
  await saveScrapeMetadata({
    info: { [company]: { ...companyScrapeMeta, isNotified: true } },
  }, tableRange)
}

const notify = async (scheduleType: ScheduleType, isForced?: boolean): Promise<void> => {
  // Get credentials for sending notifications
  const credentials = await getTelegramApiCredentials()
  await forEachCompany(async (company, i, arr, tableDetails) => {
    const { scrapeMeta } = tableDetails
    const companyScrapeMeta = (scrapeMeta?.info ?? {})[company]
    if (await shouldNotify(scheduleType, company, tableDetails, {
      isNotified: companyScrapeMeta?.isNotified,
      time: scrapeMeta?.time,
      isForced,
    })) {
      const items = await queryItemsBySchedule(company, scheduleType)
      await sendNotificationByTelegram(credentials, company, scheduleType, items)
      const meta = companyScrapeMeta ?? defaultCompanyScrapeMeta
      await saveMetaAfterNotify(company, meta, scrapeMeta?.time)
    }
  })
}

export default notify