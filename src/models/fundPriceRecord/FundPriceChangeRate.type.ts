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
export default FundPriceChangeRate