import { aws_lambda as lambda, Duration } from 'aws-cdk-lib'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'

const TIMEOUT_MINS = 5
const LOG_RETENTION_RETRY_MS = 200
const LOG_RETENTION_MAX_RETRY = 10

const defaultLambdaInput: Pick<lambda.FunctionProps,
| 'timeout'
| 'runtime'
| 'logRetention'
| 'logRetentionRetryOptions'
> = {
  timeout: Duration.minutes(TIMEOUT_MINS),
  runtime: lambda.Runtime.NODEJS_14_X,
  logRetention: RetentionDays.ONE_YEAR,
  /** Fix issues: https://github.com/aws/aws-cdk/issues/8257 */
  logRetentionRetryOptions: {
    base: Duration.millis(LOG_RETENTION_RETRY_MS),
    maxRetries: LOG_RETENTION_MAX_RETRY,
  },
}
export default defaultLambdaInput