
export type FundType = 'mpf'

export type CompanyType = 'manulife'

export type RiskLevel = 
    | 'veryLow' 
    | 'low' 
    | 'neutral' 
    | 'high' 
    | 'veryHigh'

export type RecordType = 
    | 'latest'
    | 'record'
    | 'week'
    | 'month'
    | 'quarter'

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