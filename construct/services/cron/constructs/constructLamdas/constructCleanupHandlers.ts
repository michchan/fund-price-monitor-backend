import { Construct } from 'constructs'
import { aws_lambda as lambda } from 'aws-cdk-lib'
import getDefaultLambdaInput from './getDefaultLambdaInput'

export interface CleanupHandlers {
  dedup: lambda.Function;
}
const constructCleanupHandlers = (
  scope: Construct,
  defaultInput: ReturnType<typeof getDefaultLambdaInput> & lambda.FunctionOptions,
): CleanupHandlers => {
  // Handler for de-duplications of records
  const dedupHandler = new lambda.Function(scope, 'CronDedupHandler', {
    ...defaultInput,
    handler: 'dedup.handler',
  })
  return { dedup: dedupHandler }
}
export default constructCleanupHandlers