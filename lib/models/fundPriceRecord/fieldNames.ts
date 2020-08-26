

const fieldNames = {
    COMPANY_CODE: 'company_code',
    TIME: 'time',
    NAME: 'name',
    RISK_LEVEL: 'riskLevel',
    /** Top-level fields (aggregate items) */
    WEEK: 'week',
    MONTH: 'month',
    QUARTER: 'quarter',
    PRICE_CHANGE_RATE: 'priceChangeRate',
} as const
export default fieldNames