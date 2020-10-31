import * as cdk from '@aws-cdk/core'
import * as iam from '@aws-cdk/aws-iam'
import * as lambda from '@aws-cdk/aws-lambda'

import grantCloudWatchLogGroupAccess from 'src/lib/AWS/iam/grantCloudWatchLogGroupAccess'
import defaultLambdaInput from 'src/common/defaultLambdaInput'

const SERVICE_PATHNAME = __dirname.split('/').pop() ?? ''

const ROLE_ID = 'MigrationRole'
const commonIamStatementInput = {
  resources: ['*'],
  effect: iam.Effect.ALLOW,
}

const constructIamRole = (scope: cdk.Construct): iam.Role => {
  // Create IAM roles for handlers
  const role = new iam.Role(scope, ROLE_ID, {
    assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  })
  // Grant db access permissions for handler by assigning role
  role.addToPolicy(new iam.PolicyStatement({
    ...commonIamStatementInput,
    sid: 'RWTable',
    actions: [
      'dynamodb:ListTables',
      'dynamodb:BatchWriteItem',
      'dynamodb:Query',
    ],
  }))
  // Grante s3 write permissions
  role.addToPolicy(new iam.PolicyStatement({
    ...commonIamStatementInput,
    sid: 'PutS3',
    actions: ['s3:PutObject'],
  }))
  grantCloudWatchLogGroupAccess(role)
  return role
}

export interface Handlers {
  dynamodbToS3: lambda.Function;
  s3ToDynamodb: lambda.Function;
}
const constructLamdas = (
  scope: cdk.Construct,
  role: iam.Role,
  servicePathname: string,
): Handlers => {
  // Common input for lambda Definition
  const defaultInput = {
    ...defaultLambdaInput,
    code: lambda.Code.fromAsset(`bundles/${servicePathname}/handlers`),
    role,
  }

  const dynamodbToS3Handler = new lambda.Function(scope, 'MigrateDynamodbToS3', {
    ...defaultInput,
    handler: 'dynamodbToS3.handler',
  })

  const s3ToDynamodbHandler = new lambda.Function(scope, 'MigrateS3ToDynamodb', {
    ...defaultInput,
    handler: 's3ToDynamodb.handler',
  })

  return {
    dynamodbToS3: dynamodbToS3Handler,
    s3ToDynamodb: s3ToDynamodbHandler,
  }
}

export interface Output {
  handlers: Handlers;
}
function construct (scope: cdk.Construct): Output {
  const role = constructIamRole(scope)
  const handlers = constructLamdas(scope, role, SERVICE_PATHNAME)
  return { handlers }
}

const migration = { construct } as const
export default migration