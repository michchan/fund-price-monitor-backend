import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'

import cron, { Output as CronOutput } from './services/cron'
import fundprices, { Output as FundpricesOutput } from './services/fundprices'
import logging from './services/logging'
import migration, { Output as MigrationOutput } from './services/migration'
import runtimeEnv from '../src/lib/env'

interface GroupAllHandlersOptions {
  fundpricesHandlers: FundpricesOutput['handlers'];
  cronHandlers: CronOutput['handlers'];
  migrationHandlers: MigrationOutput['handlers'];
}
const groupAllHandlers = ({
  fundpricesHandlers,
  cronHandlers,
  migrationHandlers,
}: GroupAllHandlersOptions): lambda.Function[] => [
  ...Object.values(fundpricesHandlers),
  ...Object.values(migrationHandlers),
  ...Object.values(cronHandlers)
    .reduce((
      acc: lambda.Function[],
      curr
    ) => Array.isArray(curr) ? [...acc, ...curr] : [...acc, curr], []),
]

const bindRuntimeEnvVars = (handlers: lambda.Function[]): void => {
  handlers.forEach(lambda => {
    runtimeEnv.keys.forEach(key => lambda.addEnvironment(key, runtimeEnv.values[key]))
  })
}

export class FundPriceMonitorBackendStack extends cdk.Stack {
  constructor (scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // Initialize cron service
    const { handlers: cronHandlers } = cron.construct(this)
    // Initialize fundprices service
    const { handlers: fundpricesHandlers } = fundprices.construct(this)
    // Initialize migration service
    const { handlers: migrationHandlers } = migration.construct(this)

    const handlers = groupAllHandlers({
      cronHandlers,
      fundpricesHandlers,
      migrationHandlers,
    })
    // Initialize logging service
    const { handlers: logHandlers } = logging.construct(this, {
      logGroups: handlers.map(lambda => lambda.logGroup),
    })
    // Bind runtime environment variable
    bindRuntimeEnvVars([...handlers, ...Object.values(logHandlers)])
  }
}