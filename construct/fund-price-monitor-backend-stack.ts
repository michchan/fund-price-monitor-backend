import { Construct } from 'constructs'
import { aws_lambda as lambda, Stack, StackProps } from 'aws-cdk-lib'

import runtimeEnv from '../src/lib/env'
import cron, { Output as CronOutput } from './services/cron'
import fundprices, { Output as FundpricesOutput } from './services/fundprices'
import logging from './services/logging'
import migration, { Output as MigrationOutput } from './services/migration'
import webDeployment, { Output as WebDeploymentOutput } from './services/webDeployment'

interface GroupAllHandlersOptions {
  fundpricesHandlers: FundpricesOutput['handlers'];
  cronHandlers: CronOutput['handlers'];
  migrationHandlers: MigrationOutput['handlers'];
  webDeploymentHandlers: WebDeploymentOutput['handlers'];
}
const groupAllHandlers = ({
  fundpricesHandlers,
  cronHandlers,
  migrationHandlers,
  webDeploymentHandlers,
}: GroupAllHandlersOptions): lambda.Function[] => [
  ...Object.values(webDeploymentHandlers),
  ...Object.values(fundpricesHandlers),
  ...Object.values(migrationHandlers),
  ...Object.values(cronHandlers)
    .reduce((
      acc: lambda.Function[],
      curr
    ) => Array.isArray(curr) ? [...acc, ...curr] : [...acc, curr], []),
]

// @TODO: Bind variables to the functions which used it only
const bindRuntimeEnvVars = (handlers: lambda.Function[]): void => {
  handlers.forEach(lambda => {
    runtimeEnv.keys.forEach(key => lambda.addEnvironment(key, runtimeEnv.values[key]))
  })
}

export class FundPriceMonitorBackendStack extends Stack {
  constructor (scope: Construct, id: string, props?: StackProps) {
    // PAUSE Project
    // eslint-disable-next-line no-constructor-return
    return

    super(scope, id, props)

    // Initialize web deployment service
    const { handlers: webDeploymentHandlers } = webDeployment.construct(this)
    // Initialize cron service
    const { handlers: cronHandlers } = cron.construct(this, webDeploymentHandlers)
    // Initialize fundprices service
    const { handlers: fundpricesHandlers } = fundprices.construct(this)
    // Initialize migration service
    const { handlers: migrationHandlers } = migration.construct(this)

    const handlers = groupAllHandlers({
      cronHandlers,
      fundpricesHandlers,
      migrationHandlers,
      webDeploymentHandlers,
    })
    // Initialize logging service
    const { handlers: logHandlers } = logging.construct(this, {
      // @TODO: Fix: PolicyLengthExceededException;
      logGroups: [
        ...Object.values(fundpricesHandlers),
        ...Object.values(migrationHandlers),
        ...Object.values(cronHandlers)
          .reduce((
            acc: lambda.Function[],
            curr
          ) => Array.isArray(curr) ? [...acc, ...curr] : [...acc, curr], []),
      ].map(lambda => lambda.logGroup),
    })
    // Bind runtime environment variable
    bindRuntimeEnvVars([
      ...handlers,
      ...Object.values(logHandlers.notifyErrorLogHandlers),
      logHandlers.mockErrorLog,
    ])
  }
}