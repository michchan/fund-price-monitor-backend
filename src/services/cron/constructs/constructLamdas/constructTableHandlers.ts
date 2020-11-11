import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'
import getDefaultLambdaInput from './getDefaultLambdaInput'

export interface TableHandlers {
  createTable: lambda.Function;
  updateTable: lambda.Function;
}
const constructTableHandlers = (
  scope: cdk.Construct,
  defaultInput: ReturnType<typeof getDefaultLambdaInput>,
  aggregationHandler: lambda.Function,
): TableHandlers => {
  // Common environment variables for table handling
  const commonTableHandlingEnv = { AGGREGATION_HANDLER_ARN: aggregationHandler.functionArn }

  // Handler for create table for next coming quarter
  const createTableHandler = new lambda.Function(scope, 'CronTableCreateHandler', {
    ...defaultInput,
    handler: 'createTable.handler',
    environment: commonTableHandlingEnv,
  })
  // Handler for adjust the provisioned throughput of table for previous quarter
  const updateTableHandler = new lambda.Function(scope, 'CronTableUpdateHandler', {
    ...defaultInput,
    handler: 'updateTable.handler',
    environment: commonTableHandlingEnv,
  })

  return {
    createTable: createTableHandler,
    updateTable: updateTableHandler,
  }
}
export default constructTableHandlers