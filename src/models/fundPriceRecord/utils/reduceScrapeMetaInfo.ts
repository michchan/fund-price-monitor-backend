import logObj from 'src/helpers/logObj'
import FundPriceRecord, { CompanyType, FundType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import getCompaniesFromRecords from 'src/models/fundPriceRecord/utils/getCompaniesFromRecords'
import { CompanyScrapeMeta, ScrapeMeta, ScrapeStatus } from '../FundPriceTableDetails.type'

type RT = FundPriceRecord<FundType, 'record'>

const reduceScrapeMetaInfo = (
  records: RT[],
  status: ScrapeStatus,
  companies: CompanyType[] = []
): ScrapeMeta['info'] => {
  const thisCompanies = companies.length > 0 ? companies : getCompaniesFromRecords(records)
  const info = thisCompanies.reduce((acc, comp) => {
    const isSameCompany = (rec: RT) => rec.company === comp
    const meta: Partial<CompanyScrapeMeta> = {
      size: records.filter(isSameCompany).length,
      status,
    }
    return { ...acc, [comp]: meta }
  }, {} as ScrapeMeta['info'])
  logObj('Scrape meta', info)
  return info
}
export default reduceScrapeMetaInfo