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
        sid: 'ReadTable',
        actions: [
            'dynamodb:ListTables',
            // For `waitFor` operation
            'dynamodb:DescribeTable',
            'dynamodb:Query',
            'dynamodb:Scan',
        ],
    }));

    /** ------------------ Lambda Handlers Definition ------------------ */

    // Common input for lambda Definition
    const commonLambdaInput = {
        code: lambda.Code.fromAsset('bundles/cron/handlers'),
        timeout: cdk.Duration.minutes(5),
        runtime: lambda.Runtime.NODEJS_12_X,
        memorySize: 250,
    };

    /**
     * Handler for getting list of records of a single fund
     */
    const getSingleFundRecordsHandler = new lambda.Function(scope, 'GetSingleFundRecords', {
        ...commonLambdaInput,
        handler: 'records.single.list.handler',
    });
    /**
     * Handler for getting list of records
     */
    const getComRecordsHandler = new lambda.Function(scope, 'GetCompanyRecords', {
        ...commonLambdaInput,
        handler: 'records.list.handler',
    });
    /**
     * Handler for getting list of rates
     */
    const getComRatesHandler = new lambda.Function(scope, 'GetCompanyRates', {
        ...commonLambdaInput,
        handler: 'rates.list.handler',
    });

    /** ------------------ API Gateway Definition ------------------ */

    // Create api service
    const api = new apigateway.RestApi(scope, 'MPFFundPricesApi', {
        restApiName: 'MPF Fund Prices Service',
    });

    // Add records path
    const allRecords = api.root.addResource('mpf/funds');
    const comRecords = allRecords.addResource('{company}');
    const singleFundRecords = comRecords.addResource('{code}');
    const weekRates = comRecords.addResource('week/{week}');
    const monthRates = comRecords.addResource('month/{month}');
    const quarterRates = comRecords.addResource('quarter/{quarter}');

    
}

const api = { init } as const
export default api