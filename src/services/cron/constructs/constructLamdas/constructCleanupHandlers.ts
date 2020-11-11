import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'
import getDefaultLambdaInput from './getDefaultLambdaInput'

export interface CleanupHandlers {
  dedup: lambda.Function;
}
const constructCleanupHandlers = (
  scope: cdk.Construct,
  defaultInput: ReturnType<typeof getDefaultLambdaInput>,
): CleanupHandlers => {
  // Handler for de-duplications of records
  const dedupHandler = new lambda.Function(scope, 'CronDedupHandler', {
    ...defaultInput,
    handler: 'dedup.handler',
  })
  return { dedup: dedupHandler }
}
export default constructCleanupHandlers