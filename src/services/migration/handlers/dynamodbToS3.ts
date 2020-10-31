import { Handler } from 'aws-lambda'
import getCurrentYearAndQuarter from 'src/helpers/getCurrentYearAndQuarter'
import listTables from 'src/models/fundPriceRecord/io/listTables'

export const handler: Handler = async () => {
  const [year, quarter] = getCurrentYearAndQuarter()
  // Get list of table names
  const tableNames = await listTables({ year, quarter })
  console.log(JSON.stringify({ tableNames, year, quarter }))
}