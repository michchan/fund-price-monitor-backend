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
export default FundPriceRecord