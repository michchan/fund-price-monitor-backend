import * as cdk from '@aws-cdk/core'
import * as s3 from '@aws-cdk/aws-s3'
import * as iam from '@aws-cdk/aws-iam'
import * as lambda from '@aws-cdk/aws-lambda'
import defaultLambdaInput from '../common/defaultLambdaInput'

const SERVICE_PATHNAME = 'webDeployment'

function constructS3Bucket (scope: cdk.Construct) {
  const bucket = new s3.Bucket(scope, 'WebStaticServingBucket', {
    publicReadAccess: true,
    websiteErrorDocument: '404.html',
    websiteIndexDocument: 'index.html',
  })
  bucket.addToResourcePolicy(new iam.PolicyStatement({
    sid: 'PublicReadGetObject',
    principals: [new iam.AnyPrincipal()],
    effect: iam.Effect.ALLOW,
    actions: ['s3:GetObject'],
    resources: [bucket.arnForObjects('*')],
  }))
}

interface Handlers {
  deploy: lambda.Function;
}
function constructLambdas (
  scope: cdk.Construct,
  servicePathname: string
): Handlers {
  // Common input for lambda Definition
  const defaultInput = {
    ...defaultLambdaInput,
    code: lambda.Code.fromAsset(`bundles/${servicePathname}/handlers`),
  }

  const deploy = new lambda.Function(scope, 'WebDeploymentDeploy', {
    ...defaultInput,
    handler: 'deploy.handler',
  })

  return { deploy }
}

export interface Output {
  handlers: Handlers;
}
function construct (scope: cdk.Construct): Output {
  constructS3Bucket(scope)
  const handlers = constructLambdas(scope, SERVICE_PATHNAME)
  return { handlers }
}

const webDeployment = { construct } as const
export default webDeployment