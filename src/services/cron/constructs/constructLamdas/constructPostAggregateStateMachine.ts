import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'
import * as sfn from '@aws-cdk/aws-stepfunctions'
import * as sfnTasks from '@aws-cdk/aws-stepfunctions-tasks'

import getDefaultLambdaInput from './getDefaultLambdaInput'
import { CleanupHandlers } from './constructCleanupHandlers'
import { NotificationHandlers } from './constructNotificationHandlers'

const STEP_FUNC_INTERVAL_MS = 3000
const STEP_FUNC_TIMEOUT_MINS = 10
const STEP_FUNC_RESULT_PATH = '$.Payload'

export interface PostScrapeInputHandlers extends
  Pick<CleanupHandlers, 'dedup'>,
  Pick<NotificationHandlers, 'notifyOnUpdate'> {}
export interface PostScrapeOutputHandlers {
  checkLastBatchHandler: lambda.Function;
}
export interface PostScrapeOutput extends PostScrapeOutputHandlers {
  stateMachine: sfn.StateMachine;
}

const createJobsChain = (
  scope: cdk.Construct,
  { dedup, notifyOnUpdate }: PostScrapeInputHandlers,
): sfn.Chain => {
  // Define tasks for jobs
  const waitTask = new sfn.Wait(scope, 'CronPostScrapeWaitTask', {
    time: sfn.WaitTime.duration(cdk.Duration.millis(STEP_FUNC_INTERVAL_MS)),
  })
  const dedupTask = new sfnTasks.LambdaInvoke(scope, 'Dedup task', {
    lambdaFunction: dedup,
  })
  const notifyOnUpdateTask = new sfnTasks.LambdaInvoke(scope, 'Notify on update task', {
    lambdaFunction: notifyOnUpdate,
  })
  // Create job chain
  return dedupTask
    .next(waitTask)
    .next(notifyOnUpdateTask)
}

const createChainWithStartCondition = (
  scope: cdk.Construct,
  defaultInput: ReturnType<typeof getDefaultLambdaInput>,
  jobsChain: sfn.Chain
): [
  chain: sfn.IChainable,
  checkLastBatchHandler: lambda.Function
] => {
  // Define tasks for condition
  const checkLastBatchHandler = new lambda.Function(scope, 'CronAreAllBatchAggregatedPostScrape', {
    ...defaultInput,
    handler: 'areAllBatchAggregatedPostScrape.handler',
  })
  const checkLastBatchTask = new sfnTasks.LambdaInvoke(scope, 'Check if it is the last batch', {
    lambdaFunction: checkLastBatchHandler,
  })
  // Create condition to start the jobs
  const startChoice = new sfn.Choice(scope, 'Are all batches aggregated?')
  const startCondition = sfn.Condition.booleanEquals(STEP_FUNC_RESULT_PATH, true)

  // Create chain with start condition
  const chain = checkLastBatchTask.next(
    startChoice
      .when(startCondition, jobsChain)
      .otherwise(new sfn.Succeed(scope, 'Jobs chain not executed'))
  )

  return [chain, checkLastBatchHandler]
}

const constructPostAggregateStateMachine = (
  scope: cdk.Construct,
  defaultInput: ReturnType<typeof getDefaultLambdaInput>,
  handlers: PostScrapeInputHandlers,
): PostScrapeOutput => {
  const { dedup, notifyOnUpdate } = handlers
  const jobsChain = createJobsChain(scope, handlers)
  const [
    definition,
    checkLastBatchHandler,
  ] = createChainWithStartCondition(scope, defaultInput, jobsChain)

  /** -------------- State machine -------------- */
  // Create state machine
  const stateMachine = new sfn.StateMachine(scope, 'CronPostAggStateMachine', {
    definition,
    timeout: cdk.Duration.minutes(STEP_FUNC_TIMEOUT_MINS),
  })
  // Grant lambda execution roles
  checkLastBatchHandler.grantInvoke(stateMachine.role)
  dedup.grantInvoke(stateMachine.role)
  notifyOnUpdate.grantInvoke(stateMachine.role)

  return { stateMachine, checkLastBatchHandler }
}
export default constructPostAggregateStateMachine