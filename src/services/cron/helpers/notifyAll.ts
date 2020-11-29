import sendNotificationByTelegram from './sendNotificationByTelegram'
import getTelegramApiCredentials from 'src/helpers/getTelegramApiCredentials'
import forEachCompany from 'src/models/fundPriceRecord/utils/forEachCompany'
import FundPriceRecord, { CompanyType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import queryItemsBySchedule, { ScheduleType } from './queryItemsBySchedule'
import queryDetailsByCompany from 'src/models/fundPriceRecord/io/queryDetailsByCompany'
import { Languages } from 'src/models/fundPriceRecord/FundDetails.type'
import mergeItemsWithDetails from 'src/models/fundPriceRecord/utils/mergeItemsWithDetails'
import logObj from 'src/helpers/logObj'

const LNG: Languages = 'zh_HK'

const notifyAll = async (
  scheduleType: ScheduleType,
  overridingLatestItems: { [company in CompanyType]?: FundPriceRecord[] } = {},
  companyWhitelist?: CompanyType[],
): Promise<void> => {
  // Get credentials for sending notifications
  const credentials = await getTelegramApiCredentials()
  await forEachCompany(async company => {
    // Check whitelist
    if (Array.isArray(companyWhitelist) && !companyWhitelist.includes(company)) return

    const overridingItems = overridingLatestItems[company]
    const items = overridingItems || await queryItemsBySchedule(company, scheduleType)
    const { parsedItems: detailsItems } = await queryDetailsByCompany(company, {
      shouldQueryAll: true,
    })
    const itemsWithDetails = mergeItemsWithDetails(items, detailsItems)
      .map(item => ({
        ...item,
        name: item.name[LNG],
      }))

    logObj('Items: ', items)
    logObj('detailsItems', detailsItems)
    logObj('Items with details: ', itemsWithDetails)
    logObj('Details: ', { scheduleType, company })

    if (itemsWithDetails.length === 0) throw new Error('Item array is empty.')

    await sendNotificationByTelegram(credentials, company, scheduleType, itemsWithDetails)
  })
}

export default notifyAll