import FundDetails from './FundDetails.type'
import FundPriceRecord, { FundType } from './FundPriceRecord.type'

export type AggregatedRecordType =
  | 'week'
  | 'month'
  | 'quarter'

interface FundPriceChangeRate <
  FT extends FundType = FundType,
  RT extends AggregatedRecordType = AggregatedRecordType
> extends Pick<FundPriceRecord<FT>,
  | 'company'
  | 'code'
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
  priceTimestampList: string[];
}

export interface FundPriceChangeRateWithDetails <
  FT extends FundType = FundType,
  RT extends AggregatedRecordType = AggregatedRecordType
> extends
  FundPriceChangeRate<FT, RT>,
  Omit<FundDetails, 'company' | 'code'> {}

export default FundPriceChangeRate