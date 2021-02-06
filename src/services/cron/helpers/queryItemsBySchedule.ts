import FundPriceRecord, {
  CompanyType,
  FundType,
} from 'src/models/fundPriceRecord/FundPriceRecord.type'
import FundPriceChangeRate from 'src/models/fundPriceRecord/FundPriceChangeRate.type'
import queryPeriodPriceChangeRate from 'src/models/fundPriceRecord/io/queryPeriodPriceChangeRate'
import getPeriodByRecordType from 'src/models/fundPriceRecord/utils/getPeriodByRecordType'
import queryItemsByCompany from 'src/models/fundPriceRecord/io/queryItemsByCompany'
import getSorterByCode from 'src/models/fundPriceRecord/utils/getSorterByCode'

const priceChangeRateQueryInput = { shouldQueryAll: true }

export type ScheduleType = 'onUpdate' | 'weekly' | 'monthly' | 'quarterly'

export type ItemType =
  | FundPriceChangeRate<FundType>
  | FundPriceRecord<FundType>

const queryBySchedule = async (scheduleType: ScheduleType, company: CompanyType, date: Date) => {
  switch (scheduleType) {
    case 'quarterly': {
      const period = getPeriodByRecordType('quarter', date)
      return queryPeriodPriceChangeRate(company, 'quarter', period, priceChangeRateQueryInput)
    }
    case 'monthly': {
      const period = getPeriodByRecordType('month', date)
      return queryPeriodPriceChangeRate(company, 'month', period, priceChangeRateQueryInput)
    }
    case 'weekly': {
      const period = getPeriodByRecordType('week', date)
      return queryPeriodPriceChangeRate(company, 'week', period, priceChangeRateQueryInput)
    }
    case 'onUpdate':
    default: {
      const { parsedItems, ...restOutput } = await queryItemsByCompany(company, {
        shouldQueryAll: true,
        shouldQueryLatest: true,
      })
      return {
        ...restOutput,
        parsedItems: parsedItems.map(({ dayPriceChangeRate, priceChangeRate, ...restItem }) => ({
          ...restItem,
          // 'priceChangeRate' will be used for notification,
          // Use 'dayPriceChangeRate' in prior to 'priceChangeRate' for 'onUpdate' schedule.
          priceChangeRate: dayPriceChangeRate || priceChangeRate,
        })),
      }
    }
  }
}

const queryItemsBySchedule = async (
  company: CompanyType,
  scheduleType: ScheduleType,
): Promise<ItemType[]> => {
  // Create date of latest item
  const date = new Date()
  // Query records to be sent in notification
  const { parsedItems } = await queryBySchedule(scheduleType, company, date)
  // Parse items
  return parsedItems
    // Sort by code in ascending order
    .sort(getSorterByCode())
}
export default queryItemsBySchedule