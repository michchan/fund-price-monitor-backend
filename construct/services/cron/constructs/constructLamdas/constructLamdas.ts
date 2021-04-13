import * as cdk from '@aws-cdk/core'
import * as iam from '@aws-cdk/aws-iam'
import * as sfn from '@aws-cdk/aws-stepfunctions'
import * as lambda from '@aws-cdk/aws-lambda'

import { CronRoles } from '../constructIamRoles'
import constructScrapingStateMachine, { DefaultInput, ScrapingHandlers } from './constructScrapingStateMachine'
import constructAggregators, { Aggregators } from './constructAggregators'
import constructTableHandlers, { TableHandlers } from './constructTableHandlers'
import constructNotificationHandlers, { NotificationHandlers } from './constructNotificationHandlers'
import constructCleanupHandlers, { CleanupHandlers } from './constructCleanupHandlers'
import getDefaultLambdaInput from './getDefaultLambdaInput'

export interface Handlers extends ScrapingHandlers,
  Aggregators,
  TableHandlers,
  NotificationHandlers,
  CleanupHandlers {}

export interface StateMachines {
  scrape: sfn.StateMachine;
  scrapeDetails: sfn.StateMachine;
}

interface SideHandlers extends NotificationHandlers, CleanupHandlers {}
interface SideComponents {
  handlers: SideHandlers;
}

const constructSideComponents = (
  scope: cdk.Construct,
  { itemsReader, itemsAlterer }: Pick<CronRoles, 'itemsReader' | 'itemsAlterer'>,
  { servicePathname, telegramChatId, telegramTestChatId }: Pick<Options,
  | 'servicePathname'
  | 'telegramChatId'
  | 'telegramTestChatId'
  >,
): SideComponents => {
  const getInput = (role: iam.Role) => getDefaultLambdaInput(role, servicePathname)
  const notificationHandlers = constructNotificationHandlers(
    scope,
    getInput(itemsReader),
    telegramChatId,
    telegramTestChatId,
  )
  const cleanupHandlers = constructCleanupHandlers(scope, getInput(itemsAlterer))
  return {
    handlers: {
      ...cleanupHandlers,
      ...notificationHandlers,
    },
  }
}

interface ScrapingComponentsHandlers extends ScrapingHandlers, Aggregators {}
interface ScrapingStateMachines extends Pick<StateMachines, 'scrape' | 'scrapeDetails'> {}
interface ScrapingComponents {
  handlers: ScrapingComponentsHandlers;
  stateMachines: ScrapingStateMachines;
}
interface Notifiers {
  notifyOnUpdate: lambda.Function;
  testNotifyOnUpdate: lambda.Function;
}

export interface DeploymentHandlers {
  deploy: lambda.Function;
}

interface ConstructScrapingComponentsOptions extends Pick<Options,
| 'serviceDirname'
| 'servicePathname'
| 'telegramChatId'
| 'telegramTestChatId'
> {
  roles: Pick<CronRoles, 'itemsAlterer' | 'aggregator'>;
  notifiers: Notifiers;
  deploymentHandlers: DeploymentHandlers;
}
const constructScrapingComponents = (
  scope: cdk.Construct,
  {
    serviceDirname,
    servicePathname,
    roles: { itemsAlterer, aggregator },
    notifiers: { notifyOnUpdate, testNotifyOnUpdate },
    deploymentHandlers,
  }: ConstructScrapingComponentsOptions,
): ScrapingComponents => {
  const getInput = (role: iam.Role) => getDefaultLambdaInput(role, servicePathname)
  const defaultInput: DefaultInput = {
    ...getInput(itemsAlterer),
    environment: {
      NOTIFIER_ARN: notifyOnUpdate.functionArn,
    },
  }
  const defaultInputTest: DefaultInput = {
    ...defaultInput,
    environment: {
      NOTIFIER_ARN: testNotifyOnUpdate.functionArn,
    },
  }
  const {
    stateMachines,
    ...scrapingHandlers
  } = constructScrapingStateMachine(scope, {
    serviceDirname,
    defaultInput,
    defaultInputTest,
    recordScrapeSuccessHandler: deploymentHandlers.deploy,
    detailScrapeSuccessHandler: deploymentHandlers.deploy,
  })

  const aggregators = constructAggregators(scope, getInput(aggregator))

  // Grant notifier invoke for each scraper
  scrapingHandlers.scrapers.forEach(scraper => {
    notifyOnUpdate.grantInvoke(scraper)
    testNotifyOnUpdate.grantInvoke(scraper)
  })

  return {
    handlers: {
      ...scrapingHandlers,
      aggregation: aggregators.aggregation,
    },
    stateMachines,
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
  telegramTestChatId: string;
  deploymentHandlers: DeploymentHandlers;
}
const constructLamdas = (
  scope: cdk.Construct,
  roles: CronRoles,
  options: Options,
): Output => {
  const { tableHandler } = roles
  const { servicePathname, deploymentHandlers } = options

  const sideComponents = constructSideComponents(scope, roles, options)

  const scrapingComponents = constructScrapingComponents(scope, {
    ...options,
    roles,
    notifiers: sideComponents.handlers,
    deploymentHandlers,
  })
  const { handlers: { aggregation } } = scrapingComponents

  const getInput = (role: iam.Role) => getDefaultLambdaInput(role, servicePathname)
  const tableHandlers = constructTableHandlers(scope, getInput(tableHandler), aggregation)

  return {
    stateMachines: scrapingComponents.stateMachines,
    handlers: {
      ...sideComponents.handlers,
      ...scrapingComponents.handlers,
      ...tableHandlers,
    },
  }
}
export default constructLamdas