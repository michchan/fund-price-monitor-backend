import { CompanyType, FundType } from './FundPriceRecord.type'

export type ScrapeStatus = 'pending' | 'success' | 'failed'
export interface CompanyScrapeMeta {
  /**
   * The size of the scraped records across batches.
   */
  size: number;
  /** Default to 'pending' */
  status: ScrapeStatus;
  /** Whether it has been notified for that changes */
  isNotified: boolean;
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
  /** ISO timestamp */
  SK: string;
  /** Order not preserved */
  companies: CompanyType[];
  /** Order not preserved */
  fundTypes: FundType[];
  scrapeMeta: ScrapeMeta;
  testScrapeMeta: ScrapeMeta;
}
export default FundPriceTableDetails