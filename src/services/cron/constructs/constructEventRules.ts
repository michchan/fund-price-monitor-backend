/**
 * Reference: https://docs.aws.amazon.com/lambda/latest/dg/tutorial-scheduled-events-schedule-expressions.html
 */
import * as cdk from '@aws-cdk/core'
import * as events from '@aws-cdk/aws-events'
import * as targets from '@aws-cdk/aws-events-targets'

import { StateMachines, Handlers } from './constructLamdas/constructLamdas'

// Scrape every four hour
const SCRAPE_INTERVAL_HOUR = 4
const constructDailyEventRules = (
  scope: cdk.Construct,
  { scrape: scrapeMachine }: Pick<StateMachines, 'scrape'>,
) => {
  // Define event rule
  const hourlyScrapeRule = new events.Rule(scope, 'HourlyScrapeRule', {
    schedule: events.Schedule.expression(`rate(${SCRAPE_INTERVAL_HOUR} hours)`),
  })
  hourlyScrapeRule.addTarget(new targets.SfnStateMachine(scrapeMachine))
}

const constructMonthlyEventRules = (
  scope: cdk.Construct,
  { notifyMonthly }: Pick<Handlers, 'notifyMonthly'>,
  { scrapeDetails }: Pick<StateMachines, 'scrapeDetails'>,
) => {
  // Run on the 28th day in every month at 15:00 UTC
  const monthlyReviewRule = new events.Rule(scope, 'MonthlyReviewRule', {
    schedule: events.Schedule.expression('cron(0 15 28 * ? *)'),
  })
  monthlyReviewRule.addTarget(new targets.LambdaFunction(notifyMonthly))
  monthlyReviewRule.addTarget(new targets.SfnStateMachine(scrapeDetails))
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

type EventRulesArgs = [
  scope: cdk.Construct,
  handlers: Handlers,
  stateMachines: Pick<StateMachines, 'scrape' | 'scrapeDetails'>
]
const constructEventRules = (...[scope, handlers, stateMachines]: EventRulesArgs): void => {
  constructDailyEventRules(scope, stateMachines)
  constructMonthlyEventRules(scope, handlers, stateMachines)
  constructQuarterlyEventRules(scope, handlers)
}
export default constructEventRules