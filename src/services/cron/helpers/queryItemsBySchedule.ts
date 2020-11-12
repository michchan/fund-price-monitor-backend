import FundPriceRecord, {
  CompanyType,
  FundType,
} from 'src/models/fundPriceRecord/FundPriceRecord.type'
import FundPriceChangeRate from 'src/models/fundPriceRecord/FundPriceChangeRate.type'
import queryPeriodPriceChangeRate from 'src/models/fundPriceRecord/io/queryPeriodPriceChangeRate'
import getPeriodByRecordType from 'src/models/fundPriceRecord/utils/getPeriodByRecordType'
import queryItemsByCompany from 'src/models/fundPriceRecord/io/queryItemsByCompany'
import parseChangeRate from 'src/models/fundPriceRecord/utils/parseChangeRate'
import parseRecords from 'src/models/fundPriceRecord/utils/parseRecords'
import getSorterByCode from 'src/models/fundPriceRecord/utils/getSorterByCode'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const priceChangeRateQueryInput = { shouldQueryAll: true }

export type ScheduleType = 'onUpdate' | 'weekly' | 'monthly' | 'quarterly'
const queryBySchedule = (scheduleType: ScheduleType, company: CompanyType, date: Date) => {
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
    default:
      return queryItemsByCompany(company, {
        shouldQueryAll: true,
        shouldQueryLatest: true,
      })
  }
}

export type ItemType =
  | FundPriceChangeRate<FundType>
  | FundPriceRecord<FundType>
const getItemParser = (scheduleType: ScheduleType) => (
  item: DocumentClient.AttributeMap
): ItemType => {
  switch (scheduleType) {
    case 'quarterly':
    case 'monthly':
    case 'weekly':
      return parseChangeRate(item)
    case 'onUpdate':
    default:
      return parseRecords(item)
  }
}

const queryItemsBySchedule = async (
  company: CompanyType,
  scheduleType: ScheduleType,
): Promise<ItemType[]> => {
  // Create date of latest item
  const date = new Date()
  // Query records to be sent in notification
  const queryOutput = await queryBySchedule(scheduleType, company, date)
  // Parse items
  return (queryOutput.Items || [])
    .map(getItemParser(scheduleType))
    // Sort by code in ascending order
    .sort(getSorterByCode())
}
export default queryItemsBySchedule