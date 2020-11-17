import pick from 'lodash/pick'
import isEqual from 'lodash/isEqual'
import pipeAsync from 'simply-utils/dist/async/pipeAsync'

import FundPriceRecord, { FundType } from '../FundPriceRecord.type'
import queryItemsByCompany from '../io/queryItemsByCompany'
import isPKEqual from './isPKEqual'
import logObj from 'src/helpers/logObj'
import getCompaniesFromRecords from './getCompaniesFromRecords'

type RT = FundPriceRecord<FundType, 'record'>
type LT = FundPriceRecord<FundType, 'latest'>

type PeriodicallyChangedAttributes = keyof Pick<RT,
| 'updatedDate'
| 'price'>

const takePeriodicallyChangedAttributes = <T extends RT | LT> (
  record: T
): Pick<T, PeriodicallyChangedAttributes> => pick(record, [
  'updatedDate',
  'price',
])

const hasChanges = (
  basedRecord: RT | LT,
  comparedRecord: RT | LT
): boolean => !isEqual(
  takePeriodicallyChangedAttributes(basedRecord),
  takePeriodicallyChangedAttributes(comparedRecord)
)

const takeUpdatedRecords = async (records: RT[]): Promise<RT[]> => {
  // Get companies from records
  const companies = getCompaniesFromRecords(records)
  // Get latest records by company
  const latestRecords = await pipeAsync<LT[]>(
    ...companies.map(company => async (acc: LT[] = []) => {
      const { parsedItems } = await queryItemsByCompany<LT>(company, {
        shouldQueryLatest: true,
        shouldQueryAll: true,
      })
      return [...acc, ...parsedItems]
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