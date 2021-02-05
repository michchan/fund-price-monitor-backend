import sendNotificationByTelegram, { Item } from './sendNotificationByTelegram'
import getTelegramApiCredentials from 'src/helpers/getTelegramApiCredentials'
import forEachCompany from 'src/models/fundPriceRecord/utils/forEachCompany'
import FundPriceRecord, { CompanyType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import queryItemsBySchedule, { ScheduleType } from './queryItemsBySchedule'
import queryDetails from 'src/models/fundPriceRecord/io/queryDetails'
import { Languages } from 'src/models/fundPriceRecord/FundDetails.type'
import mergeItemsWithDetails from 'src/models/fundPriceRecord/utils/mergeItemsWithDetails'
import logObj from 'src/helpers/logObj'
import getCompanyCodePK from 'src/models/fundPriceRecord/utils/getCompanyCodePK'
import takeLatestRecords from 'src/models/fundPriceRecord/utils/takeLatestRecords'

const LNG: Languages = 'zh_HK'
type OvRT = FundPriceRecord<'mpf', 'latest'>
export type OverridingItemsDict = { [company in CompanyType]?: OvRT[] }

const getItems = async (
  company: CompanyType,
  scheduleType: ScheduleType,
  overridingItems: OvRT[]
): Promise<Item[]> => {
  const fetchedItems = takeLatestRecords(await queryItemsBySchedule(company, scheduleType))
  const overriddenItems = fetchedItems
    .map(item => {
      const overridingItem = overridingItems.find(
        eachItem => getCompanyCodePK(eachItem) === getCompanyCodePK(item)
      )
      return overridingItem || item
    })
  const { parsedItems: detailsItems } = await queryDetails({ shouldQueryAll: true })
  const itemsWithDetails = mergeItemsWithDetails(overriddenItems, detailsItems)
    .map(item => ({
      ...item,
      name: item.name[LNG],
    }))

  logObj('fetchedItems: ', fetchedItems)
  logObj('Items: ', overriddenItems)
  logObj('detailsItems', detailsItems)
  logObj('Items with details: ', itemsWithDetails)
  return itemsWithDetails
}

const notifyAll = async (
  scheduleType: ScheduleType,
  companyWhitelist?: CompanyType[],
  overridingItemsDict: OverridingItemsDict = {},
): Promise<void> => {
  // Get credentials for sending notifications
  const credentials = await getTelegramApiCredentials()
  await forEachCompany(async company => {
    logObj('Details: ', { scheduleType, company })
    // Check whitelist
    if (Array.isArray(companyWhitelist) && !companyWhitelist.includes(company)) return

    const overridingItems = overridingItemsDict[company] ?? []
    const items = await getItems(company, scheduleType, overridingItems)

    if (items.length === 0) {
      console.error('Item array is empty.')
      return
    }
    await sendNotificationByTelegram({
      credentials,
      company,
      scheduleType,
      items,
    })
  })
}

export default notifyAll