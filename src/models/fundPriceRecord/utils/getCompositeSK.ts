import { FundPriceRecord } from "../FundPriceRecord.type"



const getCompositeSK = ({
    recordType,
    company,
    time,
}: FundPriceRecord): string => `${recordType}_${company}_${time}`
export default getCompositeSK