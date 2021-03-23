import * as cdk from '@aws-cdk/core'
import * as s3 from '@aws-cdk/aws-s3'
import * as iam from '@aws-cdk/aws-iam'

function constructS3Bucket (scope: cdk.Construct) {
  const bucket = new s3.Bucket(scope, 'WebStaticBucket', {
    publicReadAccess: true,
    websiteErrorDocument: 'error.html',
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

function construct (scope: cdk.Construct) {
  constructS3Bucket(scope)
}

const webDeployment = { construct } as const
export default webDeployment