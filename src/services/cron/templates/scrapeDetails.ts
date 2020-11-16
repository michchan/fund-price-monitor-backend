import { GetDataWithPage } from 'simply-utils/dist/scraping/launchPuppeteerBrowserSession'
import FundDetails from 'src/models/fundPriceRecord/FundDetails.type'
import batchCreate from 'src/models/fundPriceRecord/io/batchCreate'
import serializeFundDetails from 'src/models/fundPriceRecord/utils/serializeFundDetails'
import getFundsDetailsScraperTemplateHandler from '../helpers/getFundsDetailsScraperTemplateHandler'

type T = FundDetails
const scrapers: GetDataWithPage<T[]>[] = []
export const handler = getFundsDetailsScraperTemplateHandler(
  scrapers,
  (tableRange, records) => batchCreate(records, tableRange, serializeFundDetails)
)