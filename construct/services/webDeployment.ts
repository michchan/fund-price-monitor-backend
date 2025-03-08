import { Construct } from 'constructs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { aws_iam as iam, aws_lambda as lambda } from 'aws-cdk-lib'
import defaultLambdaInput from '../common/defaultLambdaInput'

const SERVICE_PATHNAME = 'webDeployment'

function constructS3Bucket (scope: Construct) {
  const bucket = new s3.Bucket(scope, 'WebStaticServingBucket', {
    // @TODO: Move to environment variable
    bucketName: 'fundprice.dev',
    publicReadAccess: true,
    // Allow bucket-level public access
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
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
  scope: Construct,
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
function construct (scope: Construct): Output {
  constructS3Bucket(scope)
  const handlers = constructLambdas(scope, SERVICE_PATHNAME)
  return { handlers }
}

const webDeployment = { construct } as const
export default webDeployment