import { RiskLevel } from "../FundPriceRecord.type"


const whitelist: RiskLevel[] = ['veryLow', 'low', 'neutral', 'high', 'veryHigh']
const regex = new RegExp(`^(${whitelist.join('|')})$`, 'i')

const isValidRiskLevel = (maybeRiskLevel: string): maybeRiskLevel is RiskLevel => {
    return regex.test(maybeRiskLevel)
}
export default isValidRiskLevel