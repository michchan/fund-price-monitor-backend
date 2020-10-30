import * as iam from '@aws-cdk/aws-iam'

const commonIamStatementInput = {
  resources: ['*'],
  effect: iam.Effect.ALLOW,
}

// Grant cloudwatch log group access
const grantCloudWatchLogGroupAccess = (
  role: iam.Role
): iam.Role => {
  role.addToPolicy(new iam.PolicyStatement({
    ...commonIamStatementInput,
    sid: 'LogGroupWrite',
    actions: [
      'logs:CreateLogGroup',
      'logs:CreateLogStream',
      'logs:PutLogEvents',
    ],
  }))
  return role
}
export default grantCloudWatchLogGroupAccess