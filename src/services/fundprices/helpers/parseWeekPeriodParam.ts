import dayjs from 'dayjs'
import zeroPadding from 'simply-utils/dist/number/zeroPadding'

const parseWeekPeriodParam = (week: string): string => {
  // Parse 'YYYY.nthWeek' ---> 'YYYY-MM.nthWeek'
  if (/^[0-9]{4}\.[0-9]+$/.test(week)) {
    const [YYYY, nthWeek] = week.split('.')
    const MM = dayjs(YYYY)
      .add(Number(nthWeek), 'weeks')
      .add(1, 'month')
      .get('month')
    return `${YYYY}-${zeroPadding(MM, 2)}.${nthWeek}`
  }
  return week
}

export default parseWeekPeriodParam