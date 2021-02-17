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

const grantLambdaInvoke = (role: iam.Role) => role.addToPolicy(new iam.PolicyStatement({
  ...commonIamStatementInput,
  sid: 'InvokeLambda',
  actions: [
    'lambda:InvokeFunction',
  ],
}))

export interface Roles {
  lambdaRole: iam.Role;
  apiRole: iam.Role;
}
const constructIamRoles = (scope: cdk.Construct): Roles => {
  // Create IAM roles for API handling
  const lambdaRole = new iam.Role(scope, `${ROLE_ID}Lambda`, {
    assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  })
  grantIamDBAccess(lambdaRole)
  grantCloudWatchLogGroupPermissions(lambdaRole)

  const apiRole = new iam.Role(scope, `${ROLE_ID}Apigateway`, {
    assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
  })
  grantLambdaInvoke(apiRole)

  return {
    lambdaRole,
    apiRole,
  }
}
export default constructIamRoles