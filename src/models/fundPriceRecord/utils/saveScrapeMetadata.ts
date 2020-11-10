import mapKeys from 'lodash/mapKeys'
import mapValues from 'lodash/mapValues'
import isEmpty from 'lodash/isEmpty'

import updateTableDetails, { Input as I, Output as O } from 'src/models/fundPriceRecord/io/updateTableDetails'
import attrs from 'src/models/fundPriceRecord/constants/attributeNames'
import { CompanyType, ScrapeMeta } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import TableRange from 'src/models/fundPriceRecord/TableRange.type'
import logObj from 'src/helpers/logObj'

const EXP_NAME_SCRAPE_META = '#__scrapeMeta'

const getCompanyExpName = (company: CompanyType | string) => `#${company}`
const getCompanyExpValue = (company: CompanyType | string) => `:${company}`

const saveScrapeMetadata = (
  scrapeMeta: ScrapeMeta,
  tableRange: TableRange,
  isTest?: boolean,
): Promise<O | null> => {
  if (isEmpty(scrapeMeta)) return Promise.resolve(null)

  // Map expression names
  const comExpNames = mapKeys(
    mapValues(scrapeMeta, (val, company) => company),
    (val, company) => getCompanyExpName(company)
  ) as Record<string, string>
  // Map expression values
  const comExpValues = mapKeys(scrapeMeta, (val, company) => getCompanyExpValue(company))
  // Map expression string pairs
  const updateExpPairs = Object.values(comExpNames).reduce((acc, comp) => {
    const exp = `${EXP_NAME_SCRAPE_META}.${getCompanyExpName(comp)} = ${getCompanyExpValue(comp)}`
    return [...acc, exp]
  }, [] as string[])

  const input: I = {
    UpdateExpression: `SET ${updateExpPairs.join(', ')}`,
    ExpressionAttributeNames: {
      ...comExpNames,
      [EXP_NAME_SCRAPE_META]: isTest ? attrs.TEST_SCRAPE_META : attrs.SCRAPE_META,
    },
    ExpressionAttributeValues: comExpValues,
  }
  logObj('Save scrape meta input', input)

  return updateTableDetails(input, tableRange.year, tableRange.quarter)
}
export default saveScrapeMetadata