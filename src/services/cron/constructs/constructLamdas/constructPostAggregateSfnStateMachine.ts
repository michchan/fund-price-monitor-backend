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
const constructPostAggregateSfnStateMachine = (
  scope: cdk.Construct,
  defaultInput: ReturnType<typeof getDefaultLambdaInput>,
  { dedup, notifyOnUpdate }: PostScrapeInputHandlers,
): PostScrapeOutput => {
  /** -------------- Start Condition -------------- */
  // Define tasks for condition
  const checkLastBatchHandler = new lambda.Function(scope, 'CronPostAggLastBatchChecker', {
    ...defaultInput,
    handler: 'checkLastBatchPostAggregate.handler',
  })
  const checkLastBatchTask = new sfnTasks.LambdaInvoke(scope, 'Check if it is the last batch', {
    lambdaFunction: checkLastBatchHandler,
  })
  // Create condition to start the jobs
  const startChoice = new sfn.Choice(scope, 'Are all batches aggregated?')
  const startCondition = sfn.Condition.booleanEquals(STEP_FUNC_RESULT_PATH, true)

  /** -------------- Job Chain -------------- */
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
  const jobsChain = dedupTask
    .next(waitTask)
    .next(notifyOnUpdateTask)

  /** -------------- State machine -------------- */
  // Create chain with start condition
  const definition = checkLastBatchTask.next(startChoice.when(startCondition, jobsChain))
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
export default constructPostAggregateSfnStateMachine