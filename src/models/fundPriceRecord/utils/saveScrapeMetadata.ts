import mapKeys from 'lodash/mapKeys'
import mapValues from 'lodash/mapValues'
import isDeepEmpty from 'simply-utils/object/isDeepEmpty'

import updateTableDetails, { Input as I, Output as O } from 'src/models/fundPriceRecord/io/updateTableDetails'
import attrs from 'src/models/fundPriceRecord/constants/attributeNames'
import { CompanyType } from '@michchan/fund-price-monitor-lib'
import TableRange from 'src/models/fundPriceRecord/TableRange.type'
import logObj from 'src/helpers/logObj'
import { ScrapeMeta } from '../FundPriceTableDetails.type'

const EXP_NAME_SCRAPE_META = '#__scrapeMeta'
const EXP_NAME_INFO = '#__info'
const EXP_NAME_TIME = '#__time'
const EXP_VAL_TIME = ':__time'

const getCompanyExpName = (company: CompanyType | string) => `#${company}`
const getCompanyExpValue = (company: CompanyType | string) => `:${company}`

type MapIO = [
  setExpressions: string[],
  expAttrNames: I['ExpressionAttributeNames'],
  expAttrValues: I['ExpressionAttributeValues']
]
const mapInfoInput = (
  info: ScrapeMeta['info'],
  ...[setExpressions, expAttrNames, expAttrValues]: MapIO
): MapIO => {
  // Map expression names
  const comExpNames = mapKeys(
    mapValues(info, (val, company) => company),
    (val, company) => getCompanyExpName(company)
  ) as Record<string, string>
  // Map expression values
  const comExpValues = mapKeys(info, (val, company) => getCompanyExpValue(company))
  // Map expression string pairs
  const updateExpPairs = Object.values(comExpNames).reduce((acc, comp) => {
    const name = getCompanyExpName(comp)
    const value = getCompanyExpValue(comp)
    const exp = `${EXP_NAME_SCRAPE_META}.${EXP_NAME_INFO}.${name} = ${value}`
    return [...acc, exp]
  }, [] as string[])

  return [
    [...setExpressions, ...updateExpPairs],
    { ...expAttrNames, ...comExpNames },
    { ...expAttrValues, ...comExpValues },
  ]
}

export type MetadataMode = 'test' | 'live'
const saveScrapeMetadata = (
  scrapeMeta: Partial<ScrapeMeta>,
  tableRange: TableRange,
  metadataMode: MetadataMode = 'live',
): Promise<O | null> => {
  if (isDeepEmpty(scrapeMeta)) return Promise.resolve(null)

  const { time, info } = scrapeMeta

  let setExpressions: string[] = []
  let expAttrNames: I['ExpressionAttributeNames'] = {
    [EXP_NAME_SCRAPE_META]: metadataMode === 'test' ? attrs.TEST_SCRAPE_META : attrs.SCRAPE_META,
  }
  let expAttrValues: I['ExpressionAttributeValues'] = {}

  if (info && !isDeepEmpty(info)) {
    const [setExp, expN, expV] = mapInfoInput(info, setExpressions, expAttrNames, expAttrValues)
    expAttrNames = { ...expN, [EXP_NAME_INFO]: 'info' }
    expAttrValues = expV
    setExpressions = setExp
  }
  if (time) {
    expAttrNames = { ...expAttrNames, [EXP_NAME_TIME]: 'time' }
    expAttrValues = { ...expAttrValues, [EXP_VAL_TIME]: time }
    setExpressions.push(`${EXP_NAME_SCRAPE_META}.${EXP_NAME_TIME} = ${EXP_VAL_TIME}`)
  }

  const input: I = {
    UpdateExpression: `SET ${setExpressions.join(', ')}`,
    ExpressionAttributeNames: expAttrNames,
    ExpressionAttributeValues: expAttrValues,
  }
  logObj('Save scrape meta input', input)

  return updateTableDetails(input, tableRange.year, tableRange.quarter)
}
export default saveScrapeMetadata