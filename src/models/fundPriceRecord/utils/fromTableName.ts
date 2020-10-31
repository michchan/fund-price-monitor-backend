import { Quarter } from 'simply-utils/dist/dateTime/getQuarter'
import TableRange from '../TableRange.type'

const LAST_TWO = -2

const fromTableName = (tableName: string): TableRange => {
  const [year, quarterSign] = tableName.split('_').slice(LAST_TWO)
  return {
    year,
    quarter: Number(quarterSign.replace('q', '')) as Quarter,
  }
}

export default fromTableName