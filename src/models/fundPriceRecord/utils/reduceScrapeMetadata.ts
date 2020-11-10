import { CompanyScrapeMeta, FundPriceRecord, FundType, ScrapeMeta } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import getCompaniesFromRecords from 'src/models/fundPriceRecord/utils/getCompaniesFromRecords'

type RT = FundPriceRecord<FundType, 'record'>

const reduceScrapeMetadata = (records: RT[]): ScrapeMeta => {
  const time = new Date().toISOString()
  const companies = getCompaniesFromRecords(records)
  return companies.reduce((acc, comp) => {
    const isSameCompany = (rec: RT) => rec.company === comp
    const meta: CompanyScrapeMeta = {
      size: records.filter(isSameCompany).length,
      time,
    }
    return { ...acc, [comp]: meta }
  }, {} as ScrapeMeta)
}
export default reduceScrapeMetadata