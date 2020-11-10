/**
 * Reference: https://docs.aws.amazon.com/lambda/latest/dg/tutorial-scheduled-events-schedule-expressions.html
 */
import * as cdk from '@aws-cdk/core'
import * as events from '@aws-cdk/aws-events'
import * as targets from '@aws-cdk/aws-events-targets'
import * as sfn from '@aws-cdk/aws-stepfunctions'
import * as sfnTasks from '@aws-cdk/aws-stepfunctions-tasks'

import { Handlers } from './constructLamdas'

// Scrape every two hour
const SCRAPE_INTERVAL_HOUR = 2
const SCRAPER_DELAY_MS = 300

const constructDailyEventRules = (
  scope: cdk.Construct,
  { scrapers }: Pick<Handlers, 'scrapers'>,
) => {
  const startTask = new sfn.Pass(scope, 'CronScrapeTaskStart')
  const tasks = scrapers.map((scraper, i) => {
    const id = `CronScrapeTask${i}`
    return new sfnTasks.LambdaInvoke(scope, id, { lambdaFunction: scraper })
  })
  const waitTask = new sfn.Wait(scope, 'CronScrapeWaitTask', {
    time: sfn.WaitTime.duration(cdk.Duration.millis(SCRAPER_DELAY_MS)),
  })
  const definition = tasks.reduce<sfn.Chain>(
    (chain, task) => chain.next(task).next(waitTask),
    startTask as unknown as sfn.Chain
  )
  const stateMachine = new sfn.StateMachine(scope, 'CronScrapeStateMachine', { definition })
  const hourlyScrapeRule = new events.Rule(scope, 'HourlyScrapeRule', {
    schedule: events.Schedule.expression(`cron(${SCRAPE_INTERVAL_HOUR} hours)`),
  })
  hourlyScrapeRule.addTarget(new targets.SfnStateMachine(stateMachine))
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
  constructMonthlyEventRules(...args)
  constructQuarterlyEventRules(...args)
}
export default constructEventRules