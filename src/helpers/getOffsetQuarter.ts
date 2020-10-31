import { Quarter } from 'simply-utils/dist/dateTime/getQuarter'

const MAX_QUARTER = 4

const getOffsetQuarter = (
  year: number | string,
  quarter: Quarter,
  quarterOffset: number,
): [number, Quarter] => {
  const yr = Number(year)
  const nextQuarter = quarter + (quarterOffset % MAX_QUARTER) as Quarter
  const nextYear = yr + Math.floor(quarterOffset / MAX_QUARTER)
  return [nextYear, nextQuarter]
}
export default getOffsetQuarter