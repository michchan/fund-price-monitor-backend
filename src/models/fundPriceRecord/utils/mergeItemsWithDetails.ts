import FundDetails from '../FundDetails.type'
import FundPriceChangeRate from '../FundPriceChangeRate.type'
import FundPriceRecord from '../FundPriceRecord.type'
import getCompanyCodePK from './getCompanyCodePK'

type Item = FundPriceRecord | FundPriceChangeRate
type ResultItem <T extends Item> = T & Pick<FundDetails,
| 'name'
| 'initialPrice'
| 'launchedDate'
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
    initialPrice: detailItem?.initialPrice ?? 0,
    launchedDate: detailItem?.launchedDate ?? '',
  }
})
export default mergeItemsWithDetails