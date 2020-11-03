import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'

import cron, { Output as CronOutput } from './services/cron'
import api, { Output as ApiOutput } from './services/api'
import logging from './services/logging'
import migration, { Output as MigrationOutput } from './services/migration'
import runtimeEnv from './lib/runtimeEnv'

interface GroupAllHandlersOptions {
  apiHandlers: ApiOutput['handlers'];
  cronHandlers: CronOutput['handlers'];
  migrationHandlers: MigrationOutput['handlers'];
}
const groupAllHandlers = ({
  apiHandlers,
  cronHandlers,
  migrationHandlers,
}: GroupAllHandlersOptions): lambda.Function[] => [
  ...Object.values(apiHandlers),
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
    // Initialize API service
    const { handlers: apiHandlers } = api.construct(this)
    // Initialize migration service
    const { handlers: migrationHandlers } = migration.construct(this)

    const handlers = groupAllHandlers({
      cronHandlers,
      apiHandlers,
      migrationHandlers,
    })
    bindRuntimeEnvVars(handlers)

    // Initialize logging service
    logging.construct(this, {
      logGroups: handlers.map(lambda => lambda.logGroup),
    })
  }
}