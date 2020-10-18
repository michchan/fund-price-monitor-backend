import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'
import { RetentionDays } from '@aws-cdk/aws-logs'
import { Duration } from '@aws-cdk/core'


const defaultLambdaInput: Pick<lambda.FunctionProps, 
  | 'timeout'
  | 'runtime'
  | 'logRetention'
  | 'logRetentionRetryOptions'
> = {
  timeout: cdk.Duration.minutes(5),
  runtime: lambda.Runtime.NODEJS_12_X,
  logRetention: RetentionDays.ONE_MONTH,
  /** Fix issues: https://github.com/aws/aws-cdk/issues/8257 */
  logRetentionRetryOptions: {
    base: Duration.millis(200),
    maxRetries: 10
  }
}
export default defaultLambdaInput