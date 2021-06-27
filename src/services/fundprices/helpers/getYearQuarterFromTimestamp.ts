import getDateTimeDictionary from 'src/helpers/getDateTimeDictionary'

/**
 * ISO timestamp --> `YYYY.nthQuarter`
 */
const getYearQuarterFromTimestamp = (isoTimestamp: string): string => {
  const { year, quarter } = getDateTimeDictionary(new Date(isoTimestamp))
  return `${year}.${quarter}`
}

export default getYearQuarterFromTimestamp