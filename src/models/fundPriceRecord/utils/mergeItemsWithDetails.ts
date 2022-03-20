import { FundPriceRecord, FundDetails, FundPriceChangeRate, RiskLevel } from '@michchan/fund-price-monitor-lib'
import getCompanyCodePK from './getCompanyCodePK'

type Item = FundPriceRecord | FundPriceChangeRate
type ResultItem <T extends Item> = T & Pick<FundDetails,
| 'name'
| 'initialPrice'
| 'launchedDate'
| 'riskLevel'
>

const mergeItemsWithDetails = <T extends Item> (
  items: T[],
  detailItems: FundDetails[],
): ResultItem<T>[] => items.map(item => {
  const detailItem = detailItems
    .find(eachItem => getCompanyCodePK(eachItem) === getCompanyCodePK(item))

  return {
    ...item,
    name: detailItem?.name ?? {
      en: '',
      zh_HK: '',
    },
    riskLevel: detailItem?.riskLevel ?? RiskLevel.unknown,
    initialPrice: detailItem?.initialPrice ?? 0,
    launchedDate: detailItem?.launchedDate ?? '',
  }
})
export default mergeItemsWithDetails