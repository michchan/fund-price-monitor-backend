import { Construct } from 'constructs'
import { aws_iam as iam } from 'aws-cdk-lib'
import grantCloudWatchLogGroupPermissions from '../../../lib/grantCloudWatchLogGroupPermissions'

const commonIamStatementInput = {
  resources: ['*'],
  effect: iam.Effect.ALLOW,
}
const granteIamTableReadItemsPermissions = (
  role: iam.Role
) => role.addToPolicy(new iam.PolicyStatement({
  ...commonIamStatementInput,
  sid: 'CronTableReadItemPermissions',
  actions: [
    'dynamodb:Query',
  ],
}))
const granteIamTableAlterItemsPermissions = (
  role: iam.Role
) => role.addToPolicy(new iam.PolicyStatement({
  ...commonIamStatementInput,
  sid: 'CronTableAlterItemPermissions',
  actions: [
    'dynamodb:BatchWriteItem',
    'dynamodb:PutItem',
    'dynamodb:UpdateItem',
  ],
}))
const granteIamReadTablePermissions = (
  role: iam.Role
) => role.addToPolicy(new iam.PolicyStatement({
  ...commonIamStatementInput,
  sid: 'CronReadTablePermissions',
  actions: [
    'dynamodb:ListTables',
    // For `waitFor` operation
    'dynamodb:DescribeTable',
  ],
}))
const granteIamAlterTablePermissions = (
  role: iam.Role
) => role.addToPolicy(new iam.PolicyStatement({
  ...commonIamStatementInput,
  sid: 'CronAlterTablePermissions',
  actions: [
    'dynamodb:CreateTable',
    'dynamodb:UpdateTable',
  ],
}))

const grantDynamoDBStreamPermissions = (
  role: iam.Role
) => role.addToPolicy(new iam.PolicyStatement({
  ...commonIamStatementInput,
  sid: 'CronDynamoDBStream',
  actions: [
    'dynamodb:DescribeStream',
    'dynamodb:GetRecords',
    'dynamodb:GetShardIterator',
    'dynamodb:ListStreams',
  ],
}))
const grantLambdaEventSourceMappingPermissions = (
  role: iam.Role
) => role.addToPolicy(new iam.PolicyStatement({
  ...commonIamStatementInput,
  sid: 'CronLambdaStreamMapping',
  actions: [
    'lambda:CreateEventSourceMapping',
    'lambda:DeleteEventSourceMapping',
    'lambda:ListEventSourceMappings',
    // For `waitFor` operation
    'lambda:GetFunctionConfiguration',
  ],
}))
const grantSSNParameterStorePermissions = (
  role: iam.Role
) => role.addToPolicy(new iam.PolicyStatement({
  ...commonIamStatementInput,
  sid: 'CronSSMParameterStore',
  actions: [
    'ssm:GetParameter',
  ],
}))
const grantSfnExecutionPermissions = (
  role: iam.Role
) => role.addToPolicy(new iam.PolicyStatement({
  ...commonIamStatementInput,
  sid: 'CronSfnExecution',
  actions: [
    'states:StartExecution',
  ],
}))

const constructTableHandlerRole = (scope: Construct): iam.Role => {
  const role = new iam.Role(scope, 'CronTableHandlerRole', {
    assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  })
  granteIamReadTablePermissions(role)
  granteIamAlterTablePermissions(role)
  granteIamTableAlterItemsPermissions(role)
  grantCloudWatchLogGroupPermissions(role)
  grantLambdaEventSourceMappingPermissions(role)
  grantDynamoDBStreamPermissions(role)
  return role
}

const constructItemsReaderRole = (scope: Construct): iam.Role => {
  const role = new iam.Role(scope, 'CronNotifierRole', {
    assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  })
  granteIamReadTablePermissions(role)
  granteIamTableReadItemsPermissions(role)
  grantCloudWatchLogGroupPermissions(role)
  // For notifiers getting telegram credentials
  grantSSNParameterStorePermissions(role)
  return role
}

const constructItemsAltererRole = (scope: Construct): iam.Role => {
  const role = new iam.Role(scope, 'CronAltererRole', {
    assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  })
  granteIamReadTablePermissions(role)
  granteIamTableReadItemsPermissions(role)
  granteIamTableAlterItemsPermissions(role)
  grantCloudWatchLogGroupPermissions(role)
  return role
}
const constructAggregatorRole = (scope: Construct): iam.Role => {
  const role = new iam.Role(scope, 'CronAggregatorRole', {
    assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  })
  grantDynamoDBStreamPermissions(role)
  granteIamReadTablePermissions(role)
  granteIamTableReadItemsPermissions(role)
  granteIamTableAlterItemsPermissions(role)
  grantCloudWatchLogGroupPermissions(role)
  grantSfnExecutionPermissions(role)
  return role
}

export interface CronRoles {
  tableHandler: iam.Role;
  itemsReader: iam.Role;
  itemsAlterer: iam.Role;
  aggregator: iam.Role;
}
const constructIamRoles = (scope: Construct): CronRoles => {
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