import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'
import * as sfn from '@aws-cdk/aws-stepfunctions'
import getDefaultLambdaInput from './getDefaultLambdaInput'

export interface Aggregators {
  aggregation: lambda.Function;
}
const constructAggregators = (
  scope: cdk.Construct,
  defaultInput: ReturnType<typeof getDefaultLambdaInput>,
  postAggregateStateMachine: sfn.StateMachine,
): Aggregators => {
  // Handler for aggregating top-level items of records
  const aggregation = new lambda.Function(scope, 'CronAggregator', {
    ...defaultInput,
    handler: 'aggregate.handler',
    environment: {
      POST_AGGREGATE_STATE_MACHINE_ARN: postAggregateStateMachine.stateMachineArn,
    },
  })
  return { aggregation }
}
export default constructAggregators