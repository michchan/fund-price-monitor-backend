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

export type RecordType =
  | 'latest'
  | 'record'

/**
 * A scrape recrod of the fundprice
 */
interface FundPriceRecord <
  FT extends FundType = FundType,
  RT extends RecordType = RecordType
> {
  company: CompanyType;
  /** Fund code/ID */
  code: string;
  /** YYYY-MM-DD */
  updatedDate: string;
  /** Unit price in HKD */
  price: number;
  /** Change rate compared to previous recorded time */
  priceChangeRate?: number;
  /** YYYY-MM-DD */
  riskLevel: RiskLevel;
  /** Record time in ISO timestamp */
  time: string;
  fundType: FT;
  recordType: RT;

  // @TODO: Deprecate. Use FundDetails.
  name: string;
  launchedDate: string;
  initialPrice: number;
}
export default FundPriceRecord