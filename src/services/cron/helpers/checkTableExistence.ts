import { Quarter } from 'simply-utils/dist/dateTime/getQuarter'

import listTables from 'src/models/fundPriceRecord/io/listTables'
import getTableName from 'src/models/fundPriceRecord/utils/getTableName'

const checkTableExistence = async (
  year: string | number,
  quarter: Quarter,
): Promise<boolean> => {
  const tableName = getTableName(year, quarter)
  const tableNames = await listTables({ year, quarter })
  return tableNames.some(name => name === tableName)
}
export default checkTableExistence