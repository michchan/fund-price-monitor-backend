import { Quarter } from 'simply-utils/dateTime/getQuarter'
import listAllTables from 'src/lib/AWS/dynamodb/listAllTables'

export const listQuarters = async (year?: string, quarter?: string): Promise<string[]> => {
  const { TableNames = [] } = await listAllTables(year, quarter as unknown as Quarter)
  return TableNames
    .map(tableName => (tableName.match(/[0-9]{4}_q[1-4]/)?.shift() ?? '').replace(/_q/i, '.'))
    .filter(v => !!v)
}