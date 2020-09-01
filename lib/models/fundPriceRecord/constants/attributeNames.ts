

const attributeNames = {
    // Based table partition key
    COMPANY_CODE: 'company_code',
    // Based table sort key
    TIME_SK: 'timeSK',
    COMPANY: 'company',
    NAME: 'name',
    RISK_LEVEL: 'riskLevel',
    PRICE: 'price',
    UPDATED_DATE: 'updatedDate',
    LAUNCHED_DATE: 'launchedDate',
    INITIAL_PRICE: 'initialPrice',
    FUND_TYPE: 'fundType',
    /** Top-level fields (aggregate items) */
    WEEK: 'week_index',
    MONTH: 'month_index',
    QUARTER: 'quarter',
    PRICE_CHANGE_RATE: 'priceChangeRate',
    PRICE_LIST: 'priceList',
} as const
export default attributeNames