import { FundPriceChangeRate } from "../FundPriceRecord.type"



const getCompositeSKFromChangeRate = ({
    recordType,
    company,
    period,
}: FundPriceChangeRate): string => `${recordType}_${company}_${period}`
export default getCompositeSKFromChangeRate