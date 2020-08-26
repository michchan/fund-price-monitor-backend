

const attributeNames = {
    COMPANY_CODE: 'company_code',
    TIME: 'time',
    NAME: 'name',
    RISK_LEVEL: 'riskLevel',
    PRICE: 'price',
    UPDATED_DATE: 'updatedDate',
    LAUNCHED_DATE: 'launchedDate',
    INITIAL_PRICE: 'initialPrice',
    FUND_TYPE: 'fundType',
    /** Top-level fields (aggregate items) */
    WEEK: 'week',
    MONTH: 'month',
    QUARTER: 'quarter',
    PRICE_CHANGE_RATE: 'priceChangeRate',
} as const
export default attributeNames