import * as cdk from '@aws-cdk/core'
import * as iam from '@aws-cdk/aws-iam'
import grantCloudWatchLogGroupAccess from 'src/lib/AWS/iam/grantCloudWatchLogGroupAccess'

const commonIamStatementInput = {
  resources: ['*'],
  effect: iam.Effect.ALLOW,
}
const granteIamTableReadItemsPermission = (
  role: iam.Role
) => role.addToPolicy(new iam.PolicyStatement({
  ...commonIamStatementInput,
  sid: 'CronTableReadItemPermission',
  actions: [
    'dynamodb:Query',
  ],
}))
const granteIamTableAlterItemsPermission = (
  role: iam.Role
) => role.addToPolicy(new iam.PolicyStatement({
  ...commonIamStatementInput,
  sid: 'CronTableAlterItemPermission',
  actions: [
    'dynamodb:BatchWriteItem',
    'dynamodb:PutItem',
    'dynamodb:UpdateItem',
  ],
}))
const granteIamReadTablePermission = (
  role: iam.Role
) => role.addToPolicy(new iam.PolicyStatement({
  ...commonIamStatementInput,
  sid: 'CronAlterTablePermission',
  actions: [
    'dynamodb:ListTables',
    // For `waitFor` operation
    'dynamodb:DescribeTable',
  ],
}))
const granteIamAlterTablePermission = (
  role: iam.Role
) => role.addToPolicy(new iam.PolicyStatement({
  ...commonIamStatementInput,
  sid: 'CronAlterTablePermission',
  actions: [
    'dynamodb:CreateTable',
    'dynamodb:UpdateTable',
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

const constructTableHandlerRole = (scope: cdk.Construct): iam.Role => {
  const role = new iam.Role(scope, 'CronTableHandlerRole', {
    assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  })
  granteIamReadTablePermission(role)
  granteIamAlterTablePermission(role)
  granteIamTableAlterItemsPermission(role)
  grantCloudWatchLogGroupAccess(role)
  grantLambdaStreamMappingAccess(role)
  return role
}

const constructItemsReaderRole = (scope: cdk.Construct): iam.Role => {
  const role = new iam.Role(scope, 'CronNotifierRole', {
    assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  })
  granteIamReadTablePermission(role)
  granteIamTableReadItemsPermission(role)
  grantCloudWatchLogGroupAccess(role)
  // For notifiers getting telegram credentials
  grantSSNParameterStoreAccess(role)
  return role
}

const constructItemsAltererRole = (scope: cdk.Construct): iam.Role => {
  const role = new iam.Role(scope, 'CronAltererRole', {
    assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  })
  granteIamReadTablePermission(role)
  granteIamTableReadItemsPermission(role)
  granteIamTableAlterItemsPermission(role)
  grantCloudWatchLogGroupAccess(role)
  return role
}
const constructAggregatorRole = (scope: cdk.Construct): iam.Role => {
  const role = new iam.Role(scope, 'CronAggregatorRole', {
    assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  })
  granteIamTableReadItemsPermission(role)
  granteIamTableAlterItemsPermission(role)
  grantCloudWatchLogGroupAccess(role)
  grantSfnExecutionAccess(role)
  return role
}

export interface CronRoles {
  tableHandler: iam.Role;
  itemsReader: iam.Role;
  itemsAlterer: iam.Role;
  aggregator: iam.Role;
}
const constructIamRoles = (scope: cdk.Construct): CronRoles => {
  const tableHandler = constructTableHandlerRole(scope)
  const itemsReader = constructItemsReaderRole(scope)
  const itemsAlterer = constructItemsAltererRole(scope)
  const aggregator = constructAggregatorRole(scope)
  return {
    tableHandler,
    itemsReader,
    itemsAlterer,
    aggregator,
  }
}
export default constructIamRoles