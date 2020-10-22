import * as cdk from '@aws-cdk/core'
import * as iam from '@aws-cdk/aws-iam'

const commonIamStatementInput = {
  resources: ['*'],
  effect: iam.Effect.ALLOW,
}

// Grant db access permissions for handler by assigning role
const grantIamDBAccess = (
  cronRole: iam.Role
) => cronRole.addToPolicy(new iam.PolicyStatement({
  ...commonIamStatementInput,
  sid: 'ListCreateTableBatchWriteItem',
  actions: [
    'dynamodb:ListTables',
    // For `waitFor` operation
    'dynamodb:DescribeTable',
    'dynamodb:CreateTable',
    'dynamodb:UpdateTable',
    'dynamodb:BatchWriteItem',
    'dynamodb:Query',
    'dynamodb:PutItem',
    'dynamodb:UpdateItem',
  ],
}))
// Grant cloudwatch log group access
const grantCloudWatchLogGroupAccess = (
  cronRole: iam.Role
) => cronRole.addToPolicy(new iam.PolicyStatement({
  ...commonIamStatementInput,
  sid: 'LogGroupWrite',
  actions: [
    'logs:CreateLogGroup',
    'logs:CreateLogStream',
    'logs:PutLogEvents',
  ],
}))
const grantLambdaStreamMappingAccess = (
  cronRole: iam.Role
) => cronRole.addToPolicy(new iam.PolicyStatement({
  ...commonIamStatementInput,
  sid: 'LambdaStreamMapping',
  actions: [
    'lambda:CreateEventSourceMapping',
    'lambda:DeleteEventSourceMapping',
    'lambda:ListEventSourceMappings',
    // For `waitFor` operation
    'lambda:GetFunctionConfiguration',
    'dynamodb:DescribeStream',
    'dynamodb:GetRecords',
    'dynamodb:GetShardIterator',
    'dynamodb:ListStreams',
  ],
}))
const grantSSNParameterStoreAccess = (
  cronRole: iam.Role
) => cronRole.addToPolicy(new iam.PolicyStatement({
  ...commonIamStatementInput,
  sid: 'SSMParameterStore',
  actions: [
    'ssm:GetParameter',
  ],
}))

const constructIamRole = (scope: cdk.Construct): iam.Role => {
  // Create IAM roles for scraping handlers
  const cronRole = new iam.Role(scope, 'CronRole', {
    assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  })
  grantIamDBAccess(cronRole)
  grantCloudWatchLogGroupAccess(cronRole)
  grantLambdaStreamMappingAccess(cronRole)
  grantSSNParameterStoreAccess(cronRole)
  return cronRole
}
export default constructIamRole