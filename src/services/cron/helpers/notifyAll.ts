import sendNotificationByTelegram from './sendNotificationByTelegram'
import getTelegramApiCredentials from 'src/helpers/getTelegramApiCredentials'
import forEachCompany from 'src/models/fundPriceRecord/utils/forEachCompany'
import FundPriceRecord, { CompanyType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import queryItemsBySchedule, { ScheduleType } from './queryItemsBySchedule'
import queryDetailsByCompany from 'src/models/fundPriceRecord/io/queryDetailsByCompany'
import { Languages } from 'src/models/fundPriceRecord/FundDetails.type'
import mergeItemsWithDetails from 'src/models/fundPriceRecord/utils/mergeItemsWithDetails'
import logObj from 'src/helpers/logObj'
import getCompanyCodePK from 'src/models/fundPriceRecord/utils/getCompanyCodePK'

const LNG: Languages = 'zh_HK'
type OvRT = FundPriceRecord<'mpf', 'latest'>
export type OverridingItemsDict = { [company in CompanyType]?: OvRT[] }

const notifyAll = async (
  scheduleType: ScheduleType,
  companyWhitelist?: CompanyType[],
  overridingItemsDict: OverridingItemsDict = {},
): Promise<void> => {
  // Get credentials for sending notifications
  const credentials = await getTelegramApiCredentials()
  await forEachCompany(async company => {
    // Check whitelist
    if (Array.isArray(companyWhitelist) && !companyWhitelist.includes(company)) return

    const overridingItems = overridingItemsDict[company] ?? []
    const items = (await queryItemsBySchedule(company, scheduleType))
      .map(item => {
        const overridingItem = overridingItems.find(
          eachItem => getCompanyCodePK(eachItem) === getCompanyCodePK(item)
        )
        return overridingItem || item
      })

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
    if (itemsWithDetails.length === 0) {
      console.error('Item array is empty.')
      return
    }

    await sendNotificationByTelegram({
      credentials,
      company,
      scheduleType,
      items: itemsWithDetails,
    })
  })
}

export default notifyAll