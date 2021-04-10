import { RiskLevel } from '@michchan/fund-price-monitor-lib'

const whitelist: RiskLevel[] = ['veryLow', 'low', 'neutral', 'high', 'veryHigh']
const regex = new RegExp(`^(${whitelist.join('|')})$`, 'i')

function isValidRiskLevel (maybeRiskLevel: string): maybeRiskLevel is RiskLevel {
  return regex.test(maybeRiskLevel)
}
export default isValidRiskLevel