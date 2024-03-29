import zeroPadding from 'simply-utils/number/zeroPadding'
import capitalize from 'lodash/capitalize'
import startCase from 'lodash/startCase'
import { FundPriceRecord, CompanyType, FundPriceChangeRate } from '@michchan/fund-price-monitor-lib'

import { ScheduleType } from 'src/services/cron/helpers/queryItemsBySchedule'
import getDateTimeDictionary from 'src/helpers/getDateTimeDictionary'

const PADDING = 2
const PRECISION = 2

export interface Item extends
  Pick<FundPriceRecord,
  | 'code'
  | 'price'
  | 'updatedDate'>,
  Partial<Pick<FundPriceChangeRate, 'priceChangeRate'>> {
  name: string;
}

const toTelegramMessageLines = (
  company: CompanyType,
  scheduleType: ScheduleType,
  items: Item[],
  emphasizedItems: Item['code'][] = [],
): string[] => {
  const date = new Date()
  const { year, month, week, quarter } = getDateTimeDictionary(date)
  const dateOfMonth = zeroPadding(date.getDate(), PADDING)

  // Derive title line
  const titleLine = (() => {
    const S = startCase(scheduleType)
    const C = capitalize(company)
    const Y = year
    const M = month
    const D = dateOfMonth
    const W = week
    const Q = quarter
    return `* ------ ${S} - ${C} - ${Y}-${M}-${D} (week: ${W}, Q${Q}) ------ *`
  })()
  // Derive item lines
  const itemLines = items.map(({ code, name, price, priceChangeRate = 0 }) => {
    const priceTag = `$${Number(price).toFixed(PRECISION)}`

    const rate = Number(priceChangeRate)
    const rateTag = Math.abs(rate).toFixed(PRECISION)
    const sign = Number(rate) === 0 ? '' : Number(rate) > 0 ? '+' : '-'
    const priceRateTag = `(${sign}${rateTag}%)`

    const line = `${code} - ${priceTag} ${priceRateTag} - ${name}`
    const isEmphasized = emphasizedItems.includes(code)
    return isEmphasized ? `*${line}*` : line
  })

  return [titleLine, '', ...itemLines]
}

export default toTelegramMessageLines