import { Quarter } from "simply-utils/dist/dateTime/getQuarter"

import listLatestTables from "src/models/fundPriceRecord/io/listLatestTables"
import getTableName from "src/models/fundPriceRecord/utils/getTableName"


const checkTableExistence = async (
  year: string | number, 
  quarter: Quarter,
  tableName?: string,
): Promise<boolean> => {
  const _tableName = tableName || getTableName(year, quarter)
  const tableNames = await listLatestTables({ year, quarter })
  return tableNames.some(name => name === _tableName)
}
export default checkTableExistence