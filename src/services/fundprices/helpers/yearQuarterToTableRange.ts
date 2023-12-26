import { Quarter } from 'simply-utils/dateTime/getQuarter'

import TableRange from 'src/models/fundPriceRecord/TableRange.type'

const yearQuarterToTableRange = (yearQuarter: string): TableRange => {
  const [year, quarter] = yearQuarter?.split('.')
  return {
    year,
    quarter: Number(quarter) as unknown as Quarter,
  }
}
export default yearQuarterToTableRange