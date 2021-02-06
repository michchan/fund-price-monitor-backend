import FundDetails from './FundDetails.type'

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
 * A scrape record of the fundprice
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
  riskLevel: RiskLevel;
  /** Record time in ISO timestamp */
  time: string;
  fundType: FT;
  recordType: RT;
  /** --------- 'latest' fields --------- */
  priceChangeRate?: number;
  dayPriceChangeRate?: number;
  previousPrice?: number;
  previousDayPrice?: number;
  previousTime?: string | null;
}

export interface FundPriceRecordWithDetails <
  FT extends FundType = FundType,
  RT extends RecordType = RecordType
> extends
  FundPriceRecord<FT, RT>,
  Omit<FundDetails<FT>, 'company' | 'code'> {}

export default FundPriceRecord