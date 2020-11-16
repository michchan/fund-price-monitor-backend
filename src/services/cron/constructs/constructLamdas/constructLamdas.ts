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

interface SideHandlers extends NotificationHandlers, CleanupHandlers, PostScrapeOutputHandlers {}
interface SideStateMachines extends Pick<StateMachines, 'postAggregate'> {}
interface SideComponents {
  handlers: SideHandlers;
  stateMachines: SideStateMachines;
}

const constructSideComponents = (
  scope: cdk.Construct,
  { itemsReader, itemsAlterer }: Pick<CronRoles, 'itemsReader' | 'itemsAlterer'>,
  { servicePathname, telegramChatId }: Pick<Options, 'servicePathname' | 'telegramChatId'>,
): SideComponents => {
  const getInput = (role: iam.Role) => getDefaultLambdaInput(role, servicePathname)
  const notificationHandlers = constructNotificationHandlers(
    scope,
    getInput(itemsReader),
    telegramChatId
  )
  const cleanupHandlers = constructCleanupHandlers(scope, getInput(itemsAlterer))
  const {
    stateMachine: postAggregateStateMachine,
    checkLastBatchHandler,
  } = constructPostAggregateStateMachine(scope, getInput(itemsReader), {
    dedup: cleanupHandlers.dedup,
    notifyOnUpdate: notificationHandlers.notifyOnUpdate,
  })
  return {
    handlers: {
      ...cleanupHandlers,
      ...notificationHandlers,
      checkLastBatchHandler,
    },
    stateMachines: {
      postAggregate: postAggregateStateMachine,
    },
  }
}

interface ScrapingComponentsHandlers extends ScrapingHandlers, Aggregators {}
interface ScrapingStateMachines extends Pick<StateMachines, 'scrape'> {}
interface ScrapingComponents {
  handlers: ScrapingComponentsHandlers;
  stateMachines: ScrapingStateMachines;
}
const constructScrapingComponents = (
  scope: cdk.Construct,
  { itemsAlterer, aggregator }: Pick<CronRoles, 'itemsAlterer' | 'aggregator'>,
  { serviceDirname, servicePathname }: Pick<Options, 'serviceDirname' | 'servicePathname' | 'telegramChatId'>,
  postAggregate: sfn.StateMachine
): ScrapingComponents => {
  const getInput = (role: iam.Role) => getDefaultLambdaInput(role, servicePathname)
  const {
    stateMachine: scrapeStateMachine,
    ...scrapingHandlers
  } = constructScrapingStateMachine(scope, serviceDirname, getInput(itemsAlterer))
  const aggregators = constructAggregators(scope, getInput(aggregator), postAggregate)
  return {
    handlers: {
      ...scrapingHandlers,
      aggregation: aggregators.aggregation,
    },
    stateMachines: {
      scrape: scrapeStateMachine,
    },
  }
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
  roles: CronRoles,
  options: Options,
): Output => {
  const { tableHandler } = roles
  const { servicePathname } = options

  const sideComponents = constructSideComponents(scope, roles, options)
  const { postAggregate } = sideComponents.stateMachines

  const scrapingComponents = constructScrapingComponents(scope, roles, options, postAggregate)
  const { handlers: { aggregation } } = scrapingComponents

  const getInput = (role: iam.Role) => getDefaultLambdaInput(role, servicePathname)
  const tableHandlers = constructTableHandlers(scope, getInput(tableHandler), aggregation)

  return {
    stateMachines: {
      ...sideComponents.stateMachines,
      ...scrapingComponents.stateMachines,
    },
    handlers: {
      ...sideComponents.handlers,
      ...scrapingComponents.handlers,
      ...tableHandlers,
    },
  }
}
export default constructLamdas