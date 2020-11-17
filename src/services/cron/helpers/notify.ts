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
import queryItemsBySchedule, { ItemType, ScheduleType } from './queryItemsBySchedule'
import queryDetailsByCompany from 'src/models/fundPriceRecord/io/queryDetailsByCompany'
import { Languages } from 'src/models/fundPriceRecord/FundDetails.type'
import mergeItemsWithDetails from 'src/models/fundPriceRecord/utils/mergeItemsWithDetails'
import logObj from 'src/helpers/logObj'

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

const getItemFilterPredicate = (
  scheduleType: ScheduleType,
  time: FundPriceTableDetails['time'],
) => (item: ItemType): boolean => {
  // Only take changed records for 'onUpdate' notification
  if (scheduleType === 'onUpdate')
    return new Date(item.time).getTime() >= new Date(time).getTime()
  // Preserve all items for schedule except 'onUpdate'
  return true
}

const LNG: Languages = 'zh_HK'

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
      const { parsedItems: detailsItems } = await queryDetailsByCompany(company, {
        shouldQueryAll: true,
      })
      const itemsWithDetails = mergeItemsWithDetails(items, detailsItems)
        .filter(getItemFilterPredicate(scheduleType, tableDetails.time))
        .map(item => ({
          ...item,
          name: item.name[LNG],
        }))

      if (itemsWithDetails.length === 0) {
        logObj('Items: ', items)
        logObj('Items with details: ', itemsWithDetails)
        logObj('Details: ', { scheduleType, company, tableDetails })
        throw new Error('Item array is empty.')
      }

      await sendNotificationByTelegram(credentials, company, scheduleType, itemsWithDetails)
      const meta = companyScrapeMeta ?? defaultCompanyScrapeMeta
      await saveMetaAfterNotify(company, meta, scrapeMeta?.time)
    }
  })
}

export default notify