import FundPriceRecord, { CompanyType, FundType } from 'src/models/fundPriceRecord/FundPriceRecord.type'
import { ScrapeStatus } from 'src/models/fundPriceRecord/FundPriceTableDetails.type'

type RT = FundPriceRecord<FundType, 'record'>
type CallbackOutput = [RT[], CompanyType[]]
export type Output = [
  ScrapeStatus,
  null | Error,
  ...CallbackOutput
]
const withStatus = async (callback: () => Promise<CallbackOutput>): Promise<Output> => {
  try {
    const [records, companies] = await callback()
    return ['success', null, records, companies]
  } catch (error) {
    return ['failed', error, [], []]
  }
}
export default withStatus