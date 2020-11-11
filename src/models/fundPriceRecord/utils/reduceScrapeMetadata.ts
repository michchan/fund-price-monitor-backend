import logObj from 'src/helpers/logObj'
import { CompanyScrapeMeta, FundPriceRecord, FundType, ScrapeMeta, ScrapeStatus } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import getCompaniesFromRecords from 'src/models/fundPriceRecord/utils/getCompaniesFromRecords'

type RT = FundPriceRecord<FundType, 'record'>

const reduceScrapeMetadata = (records: RT[], status: ScrapeStatus): ScrapeMeta => {
  const companies = getCompaniesFromRecords(records)
  const scrapeMeta = companies.reduce((acc, comp) => {
    const isSameCompany = (rec: RT) => rec.company === comp
    const meta: CompanyScrapeMeta = {
      size: records.filter(isSameCompany).length,
      status,
    }
    return { ...acc, [comp]: meta }
  }, {} as ScrapeMeta)
  logObj('Scrape meta', scrapeMeta)
  return scrapeMeta
}
export default reduceScrapeMetadata