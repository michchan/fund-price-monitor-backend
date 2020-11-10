export type FundType = 'mpf'

export type CompanyType =
  | 'manulife'
  | 'aia'

export type RiskLevel =
  | 'veryLow'
  | 'low'
  | 'neutral'
  | 'high'
  | 'veryHigh'

export type AggregatedRecordType =
  | 'week'
  | 'month'
  | 'quarter'

export type RecordType =
  | 'latest'
  | 'record'

/**
 * A scrape recrod of the fundprice
 */
export interface FundPriceRecord <
  FT extends FundType = FundType,
  RT extends RecordType = RecordType
> {
  company: CompanyType;
  /** Fund code/ID */
  code: string;
  name: string;
  /** YYYY-MM-DD */
  updatedDate: string;
  /** Unit price in HKD */
  price: number;
  /** Change rate compared to previous recorded time */
  priceChangeRate?: number;
  /** Initial unit price */
  initialPrice: number;
  /** YYYY-MM-DD */
  launchedDate: string;
  riskLevel: RiskLevel;
  /** Record time in ISO timestamp */
  time: string;
  fundType: FT;
  recordType: RT;
}

export interface FundPriceChangeRate <
  FT extends FundType = FundType,
  RT extends AggregatedRecordType = AggregatedRecordType
> extends Pick<FundPriceRecord<FT>,
  | 'company'
  | 'code'
  | 'name'
  | 'price'
  | 'time'
  | 'updatedDate'
  > {
  /** In `YYYY-MM_[nth week]` , `YYYY-MM` or `YYYY.[nth quarter]` */
  period: string;
  recordType: RT;
  /** --------- Aggregated fields --------- */
  priceChangeRate: number;
  priceList: number[];
}

export interface CompanyScrapeMeta {
  /**
   * ISOtimestamp. The timestamp to indicate the time after scraped data and before aggregation.
   */
  time: string;
  /**
   * The size of the scraped records across batches.
   */
  size: number;
}
/**
 * Store the metadata of the latest scrape window for each company.
 */
export type ScrapeMeta = {
  [company in CompanyType]?: CompanyScrapeMeta;
}
export interface FundPriceTableDetails {
  /** ISO timestamp */
  time: string;
  /** Order not preserved */
  companies: CompanyType[];
  /** Order not preserved */
  fundTypes: FundType[];
  scrapeMeta: ScrapeMeta;
  testScrapeMeta: ScrapeMeta;
}