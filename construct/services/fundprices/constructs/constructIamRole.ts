import * as cdk from '@aws-cdk/core'
import * as iam from '@aws-cdk/aws-iam'
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

const constructIamRole = (scope: cdk.Construct): iam.Role => {
  // Create IAM roles for API handling
  const role = new iam.Role(scope, ROLE_ID, {
    assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  })
  grantIamDBAccess(role)
  grantCloudWatchLogGroupPermissions(role)
  return role
}
export default constructIamRole