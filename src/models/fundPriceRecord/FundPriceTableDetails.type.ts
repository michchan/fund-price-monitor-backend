import { CompanyType, FundType } from '@michchan/fund-price-monitor-lib'

export type ScrapeStatus = 'pending' | 'success' | 'failed'
export interface CompanyScrapeMeta {
  /** The size of the scraped records across batches */
  size: number;
  /** Default to 'pending' */
  status: ScrapeStatus;
}
/**
 * Store the metadata of the latest scrape window for each company.
 */
export interface ScrapeMeta {
  /** The timestamp of start time of the latest scrape session */
  time: null | string;
  info: {
    [company in CompanyType]?: CompanyScrapeMeta;
  };
}
interface FundPriceTableDetails {
  /** Order not preserved */
  companies: CompanyType[];
  /** Order not preserved */
  fundTypes: FundType[];
  scrapeMeta: ScrapeMeta;
  testScrapeMeta: ScrapeMeta;
}
export default FundPriceTableDetails