import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'
import getDefaultLambdaInput from './getDefaultLambdaInput'

export interface TableHandlers {
  createNextQuarterTable: lambda.Function;
  updatePrevQuarterTable: lambda.Function;
}
const constructTableHandlers = (
  scope: cdk.Construct,
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

  return {
    createNextQuarterTable: createTableHandler,
    updatePrevQuarterTable: updateTableHandler,
  }
}
export default constructTableHandlers