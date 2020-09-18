import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import { Effect } from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';


function init (scope: cdk.Construct) {

    /** ------------------ IAM Role Definition ------------------ */

    // Create IAM roles for API handling
    const apiRole = new iam.Role(scope, 'ApiRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });
    
    // Common attributes in IAM statement
    const commonIamStatementInput = {
        resources: ['*'],
        effect: Effect.ALLOW
    };

    // Grant db access permissions for handler by assigning role
    apiRole.addToPolicy(new iam.PolicyStatement({
        ...commonIamStatementInput,
        sid: 'ReadTableRows',
        actions: [
            'dynamodb:Query',
            'dynamodb:Scan',
        ],
    }));
    // Grant cloudwatch log group access
    apiRole.addToPolicy(new iam.PolicyStatement({
        ...commonIamStatementInput,
        sid: 'LogGroupWrite',
        actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
        ],
    }));

    /** ------------------ Lambda Handlers Definition ------------------ */

    // Common input for lambda Definition
    const commonLambdaInput = {
        code: lambda.Code.fromAsset('bundles/api/handlers'),
        timeout: cdk.Duration.minutes(5),
        runtime: lambda.Runtime.NODEJS_12_X,
        role: apiRole,
    };

    /**
     * Handler for getting list of records of a single fund
     */
    const getComFundRecordsHandler = new lambda.Function(scope, 'GetCompanyFundRecords', {
        ...commonLambdaInput,
        handler: 'getCompanyFundRecords.handler',
    });
    /**
     * Handler for getting list of records
     */
    const getComRecordsHandler = new lambda.Function(scope, 'GetCompanyRecords', {
        ...commonLambdaInput,
        handler: 'getCompanyRecords.handler',
    });
    /**
     * Handler for getting list of rates
     */
    const getComSinglePeriodRatesHandler = new lambda.Function(scope, 'GetCompanySinglePeriodRates', {
        ...commonLambdaInput,
        handler: 'getCompanySinglePeriodRates.handler',
    });

    /** ------------------ API Gateway Definition ------------------ */

    // Create api service
    const api = new apigateway.RestApi(scope, 'MPFFundPricesApi', {
        restApiName: 'MPF Fund Prices Service',
    });

    // Add records path
    const funds = api.root.addResource('fundprices');
    const mpfFunds = funds.addResource('mpf');
    const comRecords = mpfFunds.addResource('{company}');
    const singleFundRecords = comRecords.addResource('{code}');

    const weekRates = comRecords.addResource('weeks');
    const weekRateSingle = weekRates.addResource('{week}');

    const monthRates = comRecords.addResource('months');
    const monthRateSingle = monthRates.addResource('{month}');

    const quarterRates = comRecords.addResource('quarters');
    const quarterRateSingle = quarterRates.addResource('{quarter}');

    // Integrations
    const getComFundRecordsIntegration = new apigateway.LambdaIntegration(getComFundRecordsHandler);
    const getComRecordsIntegration = new apigateway.LambdaIntegration(getComRecordsHandler);
    const getComSinglePeriodRatesIntegration = new apigateway.LambdaIntegration(getComSinglePeriodRatesHandler);

    // Add methods
    singleFundRecords.addMethod('GET', getComFundRecordsIntegration);
    comRecords.addMethod('GET', getComRecordsIntegration);
    weekRateSingle.addMethod('GET', getComSinglePeriodRatesIntegration);
    monthRateSingle.addMethod('GET', getComSinglePeriodRatesIntegration);
    quarterRateSingle.addMethod('GET', getComSinglePeriodRatesIntegration);

    // Add CORS options
    addCorsOptions(comRecords);
    addCorsOptions(singleFundRecords);
    addCorsOptions(weekRates);
    addCorsOptions(monthRates);
    addCorsOptions(quarterRates);
}

const api = { init } as const
export default api


/**
 * Helper to add CORS options to resources
 */
function addCorsOptions(apiResource: apigateway.IResource) {
    apiResource.addMethod('OPTIONS', new apigateway.MockIntegration({
        integrationResponses: [{
            statusCode: '200',
            responseParameters: {
                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
                'method.response.header.Access-Control-Allow-Origin': "'*'",
                'method.response.header.Access-Control-Allow-Credentials': "'false'",
                'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET'",
            },
        }],
        passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
        requestTemplates: {
            "application/json": "{\"statusCode\": 200}"
        },
    }), {
        methodResponses: [{
            statusCode: '200',
            responseParameters: {
                'method.response.header.Access-Control-Allow-Headers': true,
                'method.response.header.Access-Control-Allow-Methods': true,
                'method.response.header.Access-Control-Allow-Credentials': true,
                'method.response.header.Access-Control-Allow-Origin': true,
            },  
        }]
    })
}
