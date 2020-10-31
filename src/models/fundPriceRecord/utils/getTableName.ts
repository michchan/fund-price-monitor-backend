import { Quarter } from 'simply-utils/dist/dateTime/getQuarter'
import getQuarterOffset from 'simply-utils/dist/dateTime/getQuarterOffset'

import { PROJECT_NAMESPACE } from 'src/constants'
import stringify from 'src/helpers/stringify'

const getTableName = (
  /** In YYYY format */
  year: string | number,
  quarter: Quarter,
  quarterOffset: number = 0,
): string => {
  const [yr, qt] = getQuarterOffset(year, quarter, quarterOffset)

  if (!yr || !qt || yr < 0 || qt < 0)
    throw new Error(`Cannot get table name: ${stringify({ yr, qt })}`)

  return `${PROJECT_NAMESPACE}.FundPriceRecords_${yr}_q${qt}`
}

export default getTableName