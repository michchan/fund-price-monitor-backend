import { FundPriceRecord, CompanyType, FundType, RecordType } from '@michchan/fund-price-monitor-lib'
import { ScrapeStatus } from 'src/models/fundPriceRecord/FundPriceTableDetails.type'

type RT = FundPriceRecord<FundType, RecordType.record>
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
    return ['failed', error as Error, [], []]
  }
}
export default withStatus