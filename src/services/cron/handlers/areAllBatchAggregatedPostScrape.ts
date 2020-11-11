import { Handler } from 'aws-lambda'
import forEachCompany from 'src/models/fundPriceRecord/utils/forEachCompany'
import areAllCompanyBatchesAggregated from '../helpers/areAllCompanyBatchesAggregated'

const DELAY = 3000
export const handler: Handler<any, boolean> = async () => {
  const results: boolean[] = []
  await forEachCompany(async (company, i, arr, tableDetails) => {
    const { scrapeMeta } = tableDetails
    const info = scrapeMeta.info[company]
    // * Skip failed case
    if (info?.status !== 'failed') {
      // Pass 'true' to consider empty size (but successful) case truthy
      results.push(await areAllCompanyBatchesAggregated(tableDetails, company, true))
    }
  }, DELAY)
  const areAllBatchesAggregated = results.every(isAggregated => isAggregated)
  console.log('Are all batches aggregated:', areAllBatchesAggregated)
  return areAllBatchesAggregated
}