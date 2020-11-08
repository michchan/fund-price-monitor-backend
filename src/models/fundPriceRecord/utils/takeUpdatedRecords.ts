import uniq from 'lodash/uniq'
import omit from 'lodash/omit'
import isEqual from 'lodash/isEqual'
import pipeAsync from 'simply-utils/dist/async/pipeAsync'

import { FundPriceRecord, FundType } from '../FundPriceRecord.type'
import queryItemsByCompany from '../io/queryItemsByCompany'
import isPKEqual from './isPKEqual'
import logObj from 'src/helpers/logObj'
import parse from './parse'

type RT = FundPriceRecord<FundType, 'record'>
type LT = FundPriceRecord<FundType, 'latest'>

const takeOrganicAttribute = <T extends RT | LT> (record: T): Omit<T, 'time'> => omit(record, 'time')
const hasChanges = (
  basedRecord: RT | LT,
  comparedRecord: RT | LT
): boolean => !isEqual(
  takeOrganicAttribute(basedRecord),
  takeOrganicAttribute(comparedRecord)
)

const takeUpdatedRecords = async (records: RT[]): Promise<RT[]> => {
  // Get companies from records
  const companies = uniq(records.map(({ company }) => company))
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