import { RiskLevel } from '@michchan/fund-price-monitor-lib'

const whitelist = Object.values(RiskLevel)
const regex = new RegExp(`^(${whitelist.join('|')})$`, 'i')

function isValidRiskLevel (maybeRiskLevel: string): maybeRiskLevel is RiskLevel {
  return regex.test(maybeRiskLevel)
}
export default isValidRiskLevel