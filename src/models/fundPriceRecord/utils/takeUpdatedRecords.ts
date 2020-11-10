import omit from 'lodash/omit'
import isEqual from 'lodash/isEqual'
import pipeAsync from 'simply-utils/dist/async/pipeAsync'

import { FundPriceRecord, FundType } from '../FundPriceRecord.type'
import queryItemsByCompany from '../io/queryItemsByCompany'
import isPKEqual from './isPKEqual'
import logObj from 'src/helpers/logObj'
import parse from './parse'
import getCompaniesFromRecords from './getCompaniesFromRecords'

type RT = FundPriceRecord<FundType, 'record'>
type LT = FundPriceRecord<FundType, 'latest'>

type NonKeyAttribute =
| 'time'
| 'fundType'
| 'recordType'
| 'launchedDate'
| 'priceChangeRate'
| 'initialPrice'
| 'riskLevel'
const takeKeyAttributes = <T extends RT | LT> (
  record: T
): Omit<T, NonKeyAttribute> => omit(record, [
  'time',
  'fundType',
  'recordType',
  'launchedDate',
  'priceChangeRate',
  'initialPrice',
  'riskLevel',
])

const hasChanges = (
  basedRecord: RT | LT,
  comparedRecord: RT | LT
): boolean => !isEqual(
  takeKeyAttributes(basedRecord),
  takeKeyAttributes(comparedRecord)
)

const takeUpdatedRecords = async (records: RT[]): Promise<RT[]> => {
  // Get companies from records
  const companies = getCompaniesFromRecords(records)
  // Get latest records by company
  const latestRecords = await pipeAsync<LT[]>(
    ...companies.map(company => async (acc: LT[] = []) => {
      const records = await queryItemsByCompany(company, {
        shouldQueryLatest: true,
        shouldQueryAll: true,
      })
      const items = (records.Items ?? []).map(v => parse<FundType, 'latest'>(v))
      return [...acc, ...items]
    })
  )([])
  logObj(`Latest records (${latestRecords.length}): `, latestRecords)
  return records.filter(record => {
    // Get identical record
    const prevRecord = latestRecords.find(rec => isPKEqual(rec, record))
    return !prevRecord || hasChanges(record, prevRecord)
  })
}
export default takeUpdatedRecords