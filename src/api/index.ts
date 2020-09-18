import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import { Effect } from '@aws-cdk/aws-iam';


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

    
}

const api = { init } as const
export default api