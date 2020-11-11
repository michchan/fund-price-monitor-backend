import { Handler } from 'aws-lambda'
import forEachCompany from 'src/models/fundPriceRecord/utils/forEachCompany'
import areAllCompanyBatchesAggregated from '../helpers/areAllCompanyBatchesAggregated'

const DELAY = 3000
export const handler: Handler<any, boolean> = async () => {
  const results: boolean[] = []
  await forEachCompany(async (company, i, arr, tableDetails) => {
    const { scrapeMeta } = tableDetails
    const info = scrapeMeta.info[company]
    // * Skip failed case and empty case
    if (info?.status !== 'failed' && Number(info?.size) > 0)
      results.push(await areAllCompanyBatchesAggregated(tableDetails, company))
  }, DELAY)
  const areAllBatchesAggregated = results.every(isAggregated => isAggregated)
  console.log('Are all batches aggregated:', areAllBatchesAggregated)
  return areAllBatchesAggregated
}