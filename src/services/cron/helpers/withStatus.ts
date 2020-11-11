import { FundPriceRecord, FundType, ScrapeStatus } from 'src/models/fundPriceRecord/FundPriceRecord.type'

type RT = FundPriceRecord<FundType, 'record'>
export type Output = [
  ScrapeStatus,
  null | Error,
  RT[]
]
const withStatus = async (callback: () => Promise<RT[]>): Promise<Output> => {
  try {
    const records = await callback()
    return ['success', null, records]
  } catch (error) {
    return ['failed', error, []]
  }
}
export default withStatus