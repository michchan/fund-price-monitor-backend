import zeroPadding from 'simply-utils/number/zeroPadding'
import getWeekOfYear from 'simply-utils/dateTime/getWeekOfYear'
import getQuarter, { Quarter } from 'simply-utils/dateTime/getQuarter'

const PADDING = 2

export interface Output {
  /** YYYY */
  year: number;
  /** MM */
  month: string;
  /** Start from 1 */
  week: number;
  /** Start from 1 */
  quarter: Quarter;
}
const getDateTimeDictionary = (date: Date): Output => {
  // Get year
  const year = date.getFullYear()
  // Get month
  const month = zeroPadding(date.getMonth() + 1, PADDING)
  // Get week
  const week = getWeekOfYear(date)
  // Get quarter
  const quarter = getQuarter(date)

  return {
    year,
    month,
    week,
    quarter,
  }
}

export default getDateTimeDictionary