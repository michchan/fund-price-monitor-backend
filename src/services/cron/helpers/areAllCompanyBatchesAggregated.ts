import logObj from 'src/helpers/logObj'
import { CompanyType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import FundPriceTableDetails from 'src/models/fundPriceRecord/FundPriceTableDetails.type'
import queryItemsByCompany from 'src/models/fundPriceRecord/io/queryItemsByCompany'

const areAllCompanyBatchesAggregated = async (
  tableDetails: FundPriceTableDetails,
  company: CompanyType,
  shouldRegardAsAggregatedForEmptyScrape: boolean = true,
): Promise<boolean> => {
  const { scrapeMeta } = tableDetails
  const { time } = scrapeMeta
  logObj(`Examine scrape meta for company (${company}): `, scrapeMeta)

  if (!time) {
    logObj('Scrape session not started with time equal to null / undefined', scrapeMeta)
    return false
  }
  const info = scrapeMeta.info[company]
  if (!info) {
    logObj(`Some scrape metadata are not ready for company: ${company}`, scrapeMeta)
    return false
  }
  const { status, size } = info
  if (status !== 'success') {
    logObj(`Scrape status is not "success" for company: ${company}`, scrapeMeta)
    return false
  }
  if (size === 0 && status === 'success') {
    const isAggregated = shouldRegardAsAggregatedForEmptyScrape
    logObj(
      `Scrape successful but size empty for company: ${company} (result: ${isAggregated})`,
      scrapeMeta
    )
    return isAggregated
  }

  const { parsedItems: latestItems } = await queryItemsByCompany(company, {
    shouldQueryLatest: true,
    shouldQueryAll: true,
  })
  const aggregatedSize = latestItems
    // The latest aggregated items are supposed to be create later than the scrapeMeta.time
    .filter(item => new Date(item.time).getTime() >= new Date(time).getTime())
    .length
  // * Return false to indicate that there are some items still being processed
  if (aggregatedSize >= size) return true
  return false
}
export default areAllCompanyBatchesAggregated