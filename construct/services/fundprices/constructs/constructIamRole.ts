import { Construct } from 'constructs'
import { aws_iam as iam } from 'aws-cdk-lib'
import grantCloudWatchLogGroupPermissions from '../../../lib/grantCloudWatchLogGroupPermissions'

const ROLE_ID = 'ApiRole'
const commonIamStatementInput = {
  resources: ['*'],
  effect: iam.Effect.ALLOW,
}

// Grant db access permissions for handler by assigning role
const grantIamDBAccess = (role: iam.Role) => role.addToPolicy(new iam.PolicyStatement({
  ...commonIamStatementInput,
  sid: 'ReadTableRows',
  actions: [
    'dynamodb:Query',
    'dynamodb:Scan',
    'dynamodb:ListTables',
  ],
}))

const constructIamRole = (scope: Construct): iam.Role => {
  // Create IAM roles for API handling
  const role = new iam.Role(scope, ROLE_ID, {
    assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  })
  grantIamDBAccess(role)
  grantCloudWatchLogGroupPermissions(role)
  return role
}
export default constructIamRole