import AWS from 'src/lib/AWS'
import logObj from 'src/helpers/logObj'
import toLatestPriceRecord from 'src/models/fundPriceRecord/utils/toLatestPriceRecord'
import queryItemsByCompany from 'src/models/fundPriceRecord/io/queryItemsByCompany'
import { EventDetail } from '../helpers/getNotifyHandler'
import { Callback } from './getRecordsScraperTemplateHandler'
import getEnvVars from 'src/helpers/getEnvVar'

const notifierArn = getEnvVars('NOTIFIER_ARN')

const lambda = new AWS.Lambda()

const notifyOnScrape: Callback = async (tableRange, records, companies) => {
  // @TODO: Refractor with aggregate
  // Handle notification
  for (const company of companies) {
    /** Query previous latest records */
    const { parsedItems: prevLatestItems } = await queryItemsByCompany(company, {
      shouldQueryAll: true,
      shouldQueryLatest: true,
      at: tableRange,
    })
    const date = new Date()
    const latestItems = records.map(item => {
      const prevItem = prevLatestItems.find(eachItem => eachItem.code === item.code)
      return toLatestPriceRecord(item, date, prevItem)
    })
    logObj('Derived TEMP latestItems for notification', latestItems)

    const invokeDetails: EventDetail = {
      companyWhitelist: [company],
      overridingItemsDict: { [company]: latestItems },
    }

    // @TODO: Always notify changed items only
    await lambda.invoke({
      FunctionName: notifierArn,
      Payload: JSON.stringify({ detail: invokeDetails }),
    }).promise()
  }
}
export default notifyOnScrape