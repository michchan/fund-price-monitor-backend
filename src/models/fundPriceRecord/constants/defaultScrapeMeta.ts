import { ScrapeMeta, CompanyScrapeMeta } from '../FundPriceTableDetails.type'

export const defaultCompanyScrapeMeta: CompanyScrapeMeta = {
  size: 0,
  status: 'pending',
  isNotified: false,
}

const defaultScrapeMeta: ScrapeMeta = { time: null, info: {} }
export default defaultScrapeMeta