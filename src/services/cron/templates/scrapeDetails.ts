import { GetDataWithPage } from 'simply-utils/dist/scraping/launchPuppeteerBrowserSession'
import FundDetails from 'src/models/fundPriceRecord/FundDetails.type'
import batchCreateItems from 'src/models/fundPriceRecord/io/batchCreateItems'
import serializeFundDetails from 'src/models/fundPriceRecord/utils/serializeFundDetails'
import getFundsDetailsScraperTemplateHandler from '../helpers/getFundsDetailsScraperTemplateHandler'

type T = FundDetails
const scrapers: GetDataWithPage<T[]>[] = []
export const handler = getFundsDetailsScraperTemplateHandler(
  scrapers,
  (tableRange, records) => batchCreateItems(records, tableRange, serializeFundDetails)
)