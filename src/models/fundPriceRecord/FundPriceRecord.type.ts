
export type FundType = 'mpf'

export type CompanyType = 'manulife'

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
export interface FundPriceRecord {
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
    fundType: FundType;
    recordType: RecordType;
}

export interface FundPriceChangeRate extends Pick<FundPriceRecord, 
    | 'company'
    | 'code'
    | 'name'
    | 'price'
    | 'time'
    | 'updatedDate'
> {
    /** In `YYYY-MM_[nth week]` , `YYYY-MM` or `YYYY.[nth quarter]` */
    period: string;
    recordType: AggregatedRecordType;
    /** --------- Aggregated fields --------- */
    priceChangeRate: number;
    priceList: number[];
}

export interface FundPriceTableDetails {
    /** ISO timestamp */
    time: string;
    /** Order not preserved */
    companies: CompanyType[];
    /** Order not preserved */
    fundTypes: FundType[];
}