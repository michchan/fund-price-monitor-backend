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
            'dynamodb:ListTables',
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

    const listSingleFundRecordsHandler = new lambda.Function(scope, 'ListSingleFundRecords', {
        ...commonLambdaInput,
        handler: 'listSingleFundRecords.handler',
    });
    const listComRecordsHandler = new lambda.Function(scope, 'ListCompanyRecords', {
        ...commonLambdaInput,
        handler: 'listCompanyRecords.handler',
    });
    const listComSinglePeriodRatesHandler = new lambda.Function(scope, 'ListCompanySinglePeriodRates', {
        ...commonLambdaInput,
        handler: 'listCompanySinglePeriodRates.handler',
    });
    const searchRecordsHandler = new lambda.Function(scope, 'SearchRecords', {
        ...commonLambdaInput,
        handler: 'searchRecords.handler',
    });
    const listQuartersHandler = new lambda.Function(scope, 'ListQuarters', {
        ...commonLambdaInput,
        handler: 'listQuarters.handler',
    });

    /** ------------------ API Gateway Definition ------------------ */

    // Create api service
    const api = new apigateway.RestApi(scope, 'MPFFundPricesApi', {
        restApiName: 'MPF Fund Prices Service',
    });

    // Add records path
    // /fundprices
    const funds = api.root.addResource('fundprices');
    // /fundprices/mpf
    const mpfFunds = funds.addResource('mpf');
    // /fundprices/mpf/quarters
    const quarterrates = mpfFunds.addResource('quarters');
    // /fundprices/mpf/search
    const searchedMpfRecords = mpfFunds.addResource('search');
    // /fundprices/mpf/{company}
    const comRecords = mpfFunds.addResource('{company}');
    // /fundprices/mpf/{company}/{code}
    const singleFundRecords = comRecords.addResource('{code}');

    // /fundprices/mpf/{company}/weekrates
    const weekRates = comRecords.addResource('weekrates');
    // /fundprices/mpf/{company}/weekrates/{week}
    const weekRateSingle = weekRates.addResource('{week}');

    // /fundprices/mpf/{company}/monthrates
    const monthRates = comRecords.addResource('monthrates');
    // /fundprices/mpf/{company}/monthrates/{month}
    const monthRateSingle = monthRates.addResource('{month}');

    // /fundprices/mpf/{company}/quarterrates
    const quarterRates = comRecords.addResource('quarterrates');
    // /fundprices/mpf/{company}/quarterrates/{quarter}
    const quarterRateSingle = quarterRates.addResource('{quarter}');

    // Integrations
    const listSingleFundRecordsIntegration = new apigateway.LambdaIntegration(listSingleFundRecordsHandler);
    const listComRecordsIntegration = new apigateway.LambdaIntegration(listComRecordsHandler);
    const listComSinglePeriodRatesIntegration = new apigateway.LambdaIntegration(listComSinglePeriodRatesHandler);
    const searchRecordsIntegration = new apigateway.LambdaIntegration(searchRecordsHandler);
    const listQuartersIntegration = new apigateway.LambdaIntegration(listQuartersHandler);

    // Add methods
    singleFundRecords.addMethod('GET', listSingleFundRecordsIntegration);
    quarterrates.addMethod('GET', listQuartersIntegration);
    searchedMpfRecords.addMethod('GET', searchRecordsIntegration);
    comRecords.addMethod('GET', listComRecordsIntegration);
    weekRateSingle.addMethod('GET', listComSinglePeriodRatesIntegration);
    monthRateSingle.addMethod('GET', listComSinglePeriodRatesIntegration);
    quarterRateSingle.addMethod('GET', listComSinglePeriodRatesIntegration);

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
