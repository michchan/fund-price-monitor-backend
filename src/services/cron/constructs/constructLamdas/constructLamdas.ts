import * as cdk from '@aws-cdk/core'
import * as iam from '@aws-cdk/aws-iam'
import * as sfn from '@aws-cdk/aws-stepfunctions'

import { CronRoles } from '../constructIamRoles'
import constructScrapingStateMachine, { ScrapingHandlers } from './constructScrapingStateMachine'
import constructAggregators, { Aggregators } from './constructAggregators'
import constructTableHandlers, { TableHandlers } from './constructTableHandlers'
import constructNotificationHandlers, { NotificationHandlers } from './constructNotificationHandlers'
import constructCleanupHandlers, { CleanupHandlers } from './constructCleanupHandlers'
import constructPostAggregateStateMachine, { PostScrapeOutputHandlers } from './constructPostAggregateStateMachine'
import getDefaultLambdaInput from './getDefaultLambdaInput'

export interface Handlers extends ScrapingHandlers,
  Aggregators,
  TableHandlers,
  NotificationHandlers,
  CleanupHandlers,
  PostScrapeOutputHandlers {}

export interface StateMachines {
  scrape: sfn.StateMachine;
  postAggregate: sfn.StateMachine;
}

export interface Output {
  stateMachines: StateMachines;
  handlers: Handlers;
}

export interface Options {
  servicePathname: string;
  serviceDirname: string;
  telegramChatId: string;
}
const constructLamdas = (
  scope: cdk.Construct,
  { tableHandler, itemsReader, itemsAlterer, aggregator }: CronRoles,
  { servicePathname, serviceDirname, telegramChatId }: Options,
): Output => {
  const getDefaultInput = (role: iam.Role) => getDefaultLambdaInput(role, servicePathname)
  const notificationHandlers = constructNotificationHandlers(
    scope,
    getDefaultInput(itemsReader),
    telegramChatId
  )
  const cleanupHandlers = constructCleanupHandlers(scope, getDefaultInput(itemsAlterer))
  const {
    stateMachine: postAggregateStateMachine,
    checkLastBatchHandler,
  } = constructPostAggregateStateMachine(scope, getDefaultInput(itemsReader), {
    dedup: cleanupHandlers.dedup,
    notifyOnUpdate: notificationHandlers.notifyOnUpdate,
  })
  const {
    stateMachine: scrapeStateMachine,
    ...scrapingHandlers
  } = constructScrapingStateMachine(scope, serviceDirname, getDefaultInput(itemsAlterer))
  const aggregators = constructAggregators(
    scope,
    getDefaultInput(aggregator),
    postAggregateStateMachine
  )
  const tableHandlers = constructTableHandlers(
    scope,
    getDefaultInput(tableHandler),
    aggregators.aggregation
  )
  return {
    stateMachines: {
      scrape: scrapeStateMachine,
      postAggregate: postAggregateStateMachine,
    },
    handlers: {
      checkLastBatchHandler,
      ...scrapingHandlers,
      ...notificationHandlers,
      ...tableHandlers,
      ...cleanupHandlers,
      ...aggregators,
    },
  }
}
export default constructLamdas