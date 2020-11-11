import { Handler } from 'aws-lambda'
import logObj from 'src/helpers/logObj'
import getTableDetails from 'src/models/fundPriceRecord/io/getTableDetails'
import queryItemsByCompany from 'src/models/fundPriceRecord/io/queryItemsByCompany'
import parse from 'src/models/fundPriceRecord/utils/parse'

export const handler: Handler<any, boolean> = async () => {
  const areAllBatchesAggregated = await (async () => {
    const { companies, scrapeMeta } = await getTableDetails()
    const { time, info } = scrapeMeta

    if (!time) {
      logObj('Scrape session not started with time equal to null / undefined', scrapeMeta)
      return false
    }

    for (const company of companies) {
      const output = await queryItemsByCompany(company, {
        shouldQueryLatest: true,
        shouldQueryAll: true,
      })
      const latestItems = (output.Items ?? []).map(parse)
      const comScrapeMeta = info[company]
      if (!comScrapeMeta) {
        logObj(`Some scrape metadata are not ready for company: ${company}`, scrapeMeta)
        return false
      }
      if (comScrapeMeta.status === 'failed') {
        logObj(`Scrape failed for company: ${company}`, scrapeMeta)
        continue
      }

      // The latest aggregated items are supposed to be create later than the comScrapeMeta.time
      const numAggregated = latestItems.filter(item => (
        new Date(item.time).getTime() >= new Date(time).getTime()
      )).length
      // * Return false to indicate that there are some items still being processed
      if (numAggregated <= comScrapeMeta.size) return false
    }
    // * Return true to indicate that
    // All batches of companies of records have been aggregated successfully after scraped
    return true
  })()
  console.log('areAllBatchesAggregated:', areAllBatchesAggregated)
  return areAllBatchesAggregated
}