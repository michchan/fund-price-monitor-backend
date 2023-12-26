import dayjs from 'dayjs'
import zeroPadding from 'simply-utils/number/zeroPadding'

const parseWeekPeriodParam = (
  /** In format `YYYY.nthWeek` */
  yearWeek: string
): string => {
  // Parse 'YYYY.nthWeek' ---> 'YYYY-MM.nthWeek'
  if (/^[0-9]{4}\.[0-9]+$/.test(yearWeek)) {
    const [YYYY, nthWeek] = yearWeek.split('.')
    const MM = dayjs(YYYY, 'YYYY')
      .add(Number(nthWeek), 'weeks')
      .get('month') + 1
    return `${YYYY}-${zeroPadding(MM, 2)}.${nthWeek}`
  }
  return yearWeek
}

export default parseWeekPeriodParam