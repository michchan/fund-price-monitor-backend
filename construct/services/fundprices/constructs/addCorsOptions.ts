import * as apigateway from 'aws-cdk-lib/aws-apigateway'

/**
 * Helper to add CORS options to resources
 * @param apiResource
 */
function addCorsOptions (apiResource: apigateway.IResource): apigateway.Method {
  return apiResource.addMethod('OPTIONS', new apigateway.MockIntegration({
    integrationResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': '\'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent\'',
        'method.response.header.Access-Control-Allow-Origin': '\'*\'',
        'method.response.header.Access-Control-Allow-Credentials': '\'false\'',
        'method.response.header.Access-Control-Allow-Methods': '\'OPTIONS,GET\'',
      },
    }],
    passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
    requestTemplates: { 'application/json': '{"statusCode": 200}' },
  }), {
    methodResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
        'method.response.header.Access-Control-Allow-Credentials': true,
        'method.response.header.Access-Control-Allow-Origin': true,
      },
    }],
  })
}
export default addCorsOptions