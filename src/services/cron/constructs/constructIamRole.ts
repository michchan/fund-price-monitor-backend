import * as cdk from '@aws-cdk/core'
import * as iam from '@aws-cdk/aws-iam'
import grantCloudWatchLogGroupAccess from 'src/lib/AWS/iam/grantCloudWatchLogGroupAccess'

const ROLE_ID = 'CronRole'

const commonIamStatementInput = {
  resources: ['*'],
  effect: iam.Effect.ALLOW,
}

// Grant db access permissions for handler by assigning role
const grantIamDBAccess = (
  role: iam.Role
) => role.addToPolicy(new iam.PolicyStatement({
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
const grantLambdaStreamMappingAccess = (
  role: iam.Role
) => role.addToPolicy(new iam.PolicyStatement({
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
  role: iam.Role
) => role.addToPolicy(new iam.PolicyStatement({
  ...commonIamStatementInput,
  sid: 'SSMParameterStore',
  actions: [
    'ssm:GetParameter',
  ],
}))
const grantSfnExecutionAccess = (
  role: iam.Role
) => role.addToPolicy(new iam.PolicyStatement({
  ...commonIamStatementInput,
  sid: 'SfnExecution',
  actions: [
    'states:StartExecution',
  ],
}))

const constructIamRole = (scope: cdk.Construct): iam.Role => {
  // Create IAM roles for cron handlers
  const role = new iam.Role(scope, ROLE_ID, {
    assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  })
  grantIamDBAccess(role)
  grantCloudWatchLogGroupAccess(role)
  grantLambdaStreamMappingAccess(role)
  grantSSNParameterStoreAccess(role)
  grantSfnExecutionAccess(role)
  return role
}
export default constructIamRole