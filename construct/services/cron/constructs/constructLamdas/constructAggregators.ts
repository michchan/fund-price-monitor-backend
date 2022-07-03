import { Construct } from 'constructs'
import { aws_lambda as lambda } from 'aws-cdk-lib'
import getDefaultLambdaInput from './getDefaultLambdaInput'

export interface Aggregators {
  aggregation: lambda.Function;
  testAggregation: lambda.Function;
}
const constructAggregators = (
  scope: Construct,
  defaultInput: ReturnType<typeof getDefaultLambdaInput> & lambda.FunctionOptions,
): Aggregators => {
  // Handler for aggregating top-level items of records
  const aggregation = new lambda.Function(scope, 'CronAggregator', {
    ...defaultInput,
    handler: 'aggregate.handler',
  })

  const testAggregation = new lambda.Function(scope, 'CronTestAggregator', {
    ...defaultInput,
    handler: 'aggregate.handler',
    environment: {
      IS_TEST: 'true',
    },
  })

  return { aggregation, testAggregation }
}
export default constructAggregators