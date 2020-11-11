import logObj from 'src/helpers/logObj'
import { CompanyScrapeMeta, FundPriceRecord, FundType, ScrapeMeta, ScrapeStatus } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import getCompaniesFromRecords from 'src/models/fundPriceRecord/utils/getCompaniesFromRecords'

type RT = FundPriceRecord<FundType, 'record'>

const reduceScrapeMetaInfo = (records: RT[], status: ScrapeStatus): ScrapeMeta['info'] => {
  const companies = getCompaniesFromRecords(records)
  const info = companies.reduce((acc, comp) => {
    const isSameCompany = (rec: RT) => rec.company === comp
    const meta: CompanyScrapeMeta = {
      size: records.filter(isSameCompany).length,
      status,
    }
    return { ...acc, [comp]: meta }
  }, {} as ScrapeMeta['info'])
  logObj('Scrape meta', info)
  return info
}
export default reduceScrapeMetaInfo