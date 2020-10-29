/**
 * Reference: https://docs.aws.amazon.com/lambda/latest/dg/tutorial-scheduled-events-schedule-expressions.html
 */
import * as cdk from '@aws-cdk/core'
import * as events from '@aws-cdk/aws-events'
import * as targets from '@aws-cdk/aws-events-targets'

import { Handlers } from './constructLamdas'

const TOTAL_HOURS = 24
const SCRAPE_START_HOUR = 18
/** Offset to prevent burst of DynamoDB provisioned throughputs */
const EACH_SCRAPE_OFFSET_MINS = 15
const MIN_SCRAPE_REVIEW_GAP_HOUR = 8
const DAILY_REVIEW_HOUR = (SCRAPE_START_HOUR + MIN_SCRAPE_REVIEW_GAP_HOUR) % TOTAL_HOURS

const constructDailyEventRules = (
  scope: cdk.Construct,
  { scrapers, notifyDaily }: Pick<Handlers, 'scrapers' | 'notifyDaily'>,
) => {
  // Add target for each scraper
  scrapers.forEach((handler, i) => {
    const id = `DailyScrapeRule${i}${handler.functionName}`
    const basedTimeNum = Number(`${SCRAPE_START_HOUR}00`)
    const scrapeTime = `${basedTimeNum + (i * EACH_SCRAPE_OFFSET_MINS)}`
    const hr = Number(scrapeTime.substr(0, Math.floor(scrapeTime.length / 2)))
    const min = Number(scrapeTime.substr(scrapeTime.length - 2))
    // Run every day upon 18:00 UTC
    // See https://docs.aws.amazon.com/lambda/latest/dg/tutorial-scheduled-events-schedule-expressions.html
    const eachDailyScrapeRule = new events.Rule(scope, id, {
      schedule: events.Schedule.expression(`cron(${min} ${hr} * * ? *)`),
    })
    eachDailyScrapeRule.addTarget(new targets.LambdaFunction(handler))
  })

  const reviewHr = DAILY_REVIEW_HOUR
  // Run every day at 02:00 UTC
  const dailyReviewRule = new events.Rule(scope, 'DailyAlarmRule', {
    schedule: events.Schedule.expression(`cron(0 ${reviewHr} * * ? *)`),
  })
  dailyReviewRule.addTarget(new targets.LambdaFunction(notifyDaily))
}

const constructWeeklyEventRules = (
  scope: cdk.Construct,
  { notifyWeekly }: Pick<Handlers, 'notifyWeekly'>,
) => {
  // Run on Saturday in every week at 15:00 UTC
  const weeklyReviewRule = new events.Rule(scope, 'WeeklyReviewRule', {
    schedule: events.Schedule.expression('cron(0 15 ? * 7 *)'),
  })
  weeklyReviewRule.addTarget(new targets.LambdaFunction(notifyWeekly))
}

const constructMonthlyEventRules = (
  scope: cdk.Construct,
  { notifyMonthly }: Pick<Handlers, 'notifyMonthly'>,
) => {
  // Run on the 28th day in every month at 15:00 UTC
  const monthlyReviewRule = new events.Rule(scope, 'MonthlyReviewRule', {
    schedule: events.Schedule.expression('cron(0 15 28 * ? *)'),
  })
  monthlyReviewRule.addTarget(new targets.LambdaFunction(notifyMonthly))
}

const constructQuarterlyEventRules = (
  scope: cdk.Construct,
  {
    notifyQuarterly,
    createTable,
    updateTable,
  }: Pick<Handlers, 'notifyQuarterly' | 'createTable' | 'updateTable'>,
) => {
  // Run every END of a quarter
  // At 15:00 UTC, on the 28th day, in March, June, September and December
  const quarterNearEndRule = new events.Rule(scope, 'QuarterNearEndRule', {
    schedule: events.Schedule.expression('cron(0 15 28 3,6,9,12 ? *)'),
  })
  quarterNearEndRule.addTarget(new targets.LambdaFunction(createTable))
  quarterNearEndRule.addTarget(new targets.LambdaFunction(notifyQuarterly))

  // Run every START of a quarter
  // At 00:00AM UTC, on the 1st day, in January, April, July and October
  const quarterStartRule = new events.Rule(scope, 'QuarterStartRule', {
    schedule: events.Schedule.expression('cron(0 0 1 1,4,7,10 ? *)'),
  })
  quarterStartRule.addTarget(new targets.LambdaFunction(updateTable))
}

type EventRulesArgs = [scope: cdk.Construct, handlers: Handlers]
const constructEventRules = (...args: EventRulesArgs): void => {
  constructDailyEventRules(...args)
  constructWeeklyEventRules(...args)
  constructMonthlyEventRules(...args)
  constructQuarterlyEventRules(...args)
}
export default constructEventRules