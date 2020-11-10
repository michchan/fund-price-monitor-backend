import { Handler } from 'aws-lambda'
import getTableDetails from 'src/models/fundPriceRecord/io/getTableDetails'
import queryItemsByCompany from 'src/models/fundPriceRecord/io/queryItemsByCompany'
import parse from 'src/models/fundPriceRecord/utils/parse'
import { ARE_ALL_BATCHES_AGGREGATED } from '../constants'

type Output = {
  [key in (typeof ARE_ALL_BATCHES_AGGREGATED)]: boolean;
}
export const handler: Handler<any, Output> = async () => {
  const areAllBatchesAggregated = await (async () => {
    const { companies, scrapeMeta } = await getTableDetails()
    for (const company of companies) {
      const output = await queryItemsByCompany(company, {
        shouldQueryLatest: true,
        shouldQueryAll: true,
      })
      const latestItems = (output.Items ?? []).map(parse)
      const comScrapeMeta = scrapeMeta[company]
      if (!comScrapeMeta) continue

      // The latest aggregated items are supposed to be create later than the comScrapeMeta.time
      const numAggregated = latestItems.filter(item => (
        new Date(item.time).getTime() >= new Date(comScrapeMeta.time).getTime()
      )).length
      // * Return false to indicate that there are some items still being processed
      if (numAggregated <= comScrapeMeta.size) return false
    }
    // * Return true to indicate that
    // All batches of companies of records have been aggregated successfully after scraped
    return true
  })()
  console.log('areAllBatchesAggregated:', areAllBatchesAggregated)
  return { areAllBatchesAggregated }
}