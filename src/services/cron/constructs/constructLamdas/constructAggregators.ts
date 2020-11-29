import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'
import getDefaultLambdaInput from './getDefaultLambdaInput'

export interface Aggregators {
  aggregation: lambda.Function;
}
const constructAggregators = (
  scope: cdk.Construct,
  defaultInput: ReturnType<typeof getDefaultLambdaInput> & lambda.FunctionOptions,
): Aggregators => {
  // Handler for aggregating top-level items of records
  const aggregation = new lambda.Function(scope, 'CronAggregator', {
    ...defaultInput,
    handler: 'aggregate.handler',
  })
  return { aggregation }
}
export default constructAggregators