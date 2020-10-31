import { Handler } from 'aws-lambda'
import { Quarter } from 'simply-utils/dist/dateTime/getQuarter'
import getCurrentYearAndQuarter from 'src/helpers/getCurrentYearAndQuarter'
import listTables from 'src/models/fundPriceRecord/io/listTables'

export const handler: Handler = async () => {
  const [year, quarter] = getCurrentYearAndQuarter()
  // Get list of table names
  const tableNames = await listTables({ year, quarter: quarter - 1 as Quarter })
  console.log(JSON.stringify(tableNames))
}