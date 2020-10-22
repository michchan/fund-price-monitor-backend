import getCurrentYearAndQuarter from 'src/helpers/getCurrentYearAndQuarter'
import getTableName from './getTableName'

/**
 * Check whether the table is of the current quarter given the table name
 */
const isTableOfCurrentQuarter = (tableName: string): boolean => {
  const [year, quarter] = getCurrentYearAndQuarter()
  return tableName === getTableName(year, quarter)
}

export default isTableOfCurrentQuarter