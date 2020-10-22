import { Quarter } from 'simply-utils/dist/dateTime/getQuarter'

import { PROJECT_NAMESPACE } from 'src/constants'
import stringify from 'src/helpers/stringify'

const MAX_QUARTER = 4

const getTableName = (
  /** In YYYY format */
  year: string | number,
  quarter: Quarter,
  quarterOffset: number = 0,
): string => {
  const diffYr = Math.trunc(quarterOffset / MAX_QUARTER)
  const diffQuarter = quarterOffset % MAX_QUARTER

  const yr = Number(year) + diffYr
  const qt = Number(quarter) + diffQuarter

  if (!yr || !qt || yr < 0 || qt < 0)
    throw new Error(`Cannot get table name: ${stringify({ yr, qt })}`)

  return `${PROJECT_NAMESPACE}.FundPriceRecords_${yr}_q${qt}`
}

export default getTableName