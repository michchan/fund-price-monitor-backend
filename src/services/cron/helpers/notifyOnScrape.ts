import getEnvVar from 'simply-utils/utils/getEnvVar'

import AWS from 'src/lib/AWS'
import logObj from 'src/helpers/logObj'
import toLatestPriceRecord from 'src/models/fundPriceRecord/utils/toLatestPriceRecord'
import { EventDetail } from '../helpers/getNotifyHandler'
import { Callback } from './getRecordsScraperTemplateHandler'
import queryPrevLatestItems from 'src/models/fundPriceRecord/io/queryPrevLatestItems'

const notifierArn = getEnvVar('NOTIFIER_ARN')

const lambda = new AWS.Lambda()

const notifyOnScrape: Callback = async (tableRange, records, companies) => {
  // @TODO: Refractor with aggregate
  // Handle notification
  for (const company of companies) {
    /** Query previous latest records */
    const prevLatestItems = await queryPrevLatestItems(company, tableRange)
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