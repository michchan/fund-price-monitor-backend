import { Construct } from 'constructs'
import { aws_lambda as lambda, Duration } from 'aws-cdk-lib'
import getDefaultLambdaInput from './getDefaultLambdaInput'

const MAX_DURATION_MINS = 15

export interface TableHandlers {
  createNextQuarterTable: lambda.Function;
  updatePrevQuarterTable: lambda.Function;
  syncTable: lambda.Function;
}
const constructTableHandlers = (
  scope: Construct,
  defaultInput: ReturnType<typeof getDefaultLambdaInput> & lambda.FunctionOptions,
  aggregationHandler: lambda.Function,
): TableHandlers => {
  // Common environment variables for table handling
  const commonTableHandlingEnv = { AGGREGATION_HANDLER_ARN: aggregationHandler.functionArn }

  // Handler for create table for next coming quarter
  const createTableHandler = new lambda.Function(scope, 'CronTableCreateHandler', {
    ...defaultInput,
    handler: 'createNextQuarterTable.handler',
    environment: commonTableHandlingEnv,
  })
  // Handler for adjust the provisioned throughput of table for previous quarter
  const updateTableHandler = new lambda.Function(scope, 'CronTableUpdateHandler', {
    ...defaultInput,
    handler: 'updatePrevQuarterTable.handler',
    environment: commonTableHandlingEnv,
  })

  // Handler for sync tables config
  const syncTableHandler = new lambda.Function(scope, 'CronSyncTablesConfigHandler', {
    ...defaultInput,
    handler: 'syncTablesConfig.handler',
    environment: commonTableHandlingEnv,
    timeout: Duration.minutes(MAX_DURATION_MINS),
  })

  return {
    createNextQuarterTable: createTableHandler,
    updatePrevQuarterTable: updateTableHandler,
    syncTable: syncTableHandler,
  }
}
export default constructTableHandlers