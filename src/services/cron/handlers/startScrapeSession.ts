import { Handler } from 'aws-lambda'
import getDateTimeDictionary from 'src/helpers/getDateTimeDictionary'
import saveScrapeMetadata from 'src/models/fundPriceRecord/utils/saveScrapeMetadata'

export const handler: Handler = async () => {
  const date = new Date()
  const tableRange = getDateTimeDictionary(date)
  const time = date.toISOString()
  // Initialize a scrape session
  await saveScrapeMetadata({
    time,
    info: {},
  }, tableRange)
}