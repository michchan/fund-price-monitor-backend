import { Handler } from 'aws-lambda'
import listTables from 'src/models/fundPriceRecord/io/listTables'

export const handler: Handler = async () => {
  // Get list of table names
  const tableNames = await listTables()
  console.log(JSON.stringify({ tableNames }))
}