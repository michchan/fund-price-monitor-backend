import logObj from 'src/helpers/logObj'
import { CompanyType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import FundPriceTableDetails from 'src/models/fundPriceRecord/FundPriceTableDetails.type'
import queryItemsByCompany from 'src/models/fundPriceRecord/io/queryItemsByCompany'
import parse from 'src/models/fundPriceRecord/utils/parse'

const areAllCompanyBatchesAggregated = async (
  tableDetails: FundPriceTableDetails,
  company: CompanyType,
): Promise<boolean> => {
  const { scrapeMeta } = tableDetails
  const { time } = scrapeMeta
  if (!time) {
    logObj('Scrape session not started with time equal to null / undefined', scrapeMeta)
    return false
  }
  const info = scrapeMeta.info[company]
  if (!info) {
    logObj(`Some scrape metadata are not ready for company: ${company}`, scrapeMeta)
    return false
  }
  const { status } = info
  if (status !== 'success') {
    logObj(`Scrape status is not "success" for company: ${company}`, scrapeMeta)
    return false
  }
  const output = await queryItemsByCompany(company, {
    shouldQueryLatest: true,
    shouldQueryAll: true,
  })
  const latestItems = (output.Items ?? []).map(parse)
  const aggregatedSize = latestItems
    // The latest aggregated items are supposed to be create later than the scrapeMeta.time
    .filter(item => new Date(item.time).getTime() >= new Date(time).getTime())
    .length
  // * Return false to indicate that there are some items still being processed
  if (aggregatedSize >= info.size) return true
  return false
}
export default areAllCompanyBatchesAggregated