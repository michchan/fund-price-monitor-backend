import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as events from '@aws-cdk/aws-events';
import * as targets from '@aws-cdk/aws-events-targets';
import * as path from 'path';


export class CronStack {
    constructor(scope: cdk.Construct) {    
        // Handler for Manulife MPF performance scraping
        const scrapeManulifeMPFPerformance = new lambda.Function(scope, 'scrapeManulifeMPFPerformance', {
            code: lambda.Code.fromAsset('bundles/handlers'),
            handler: 'scrapeManulifeMPFPerformance.handler',
            timeout: cdk.Duration.seconds(300),
            runtime: lambda.Runtime.NODEJS_12_X,
            memorySize: 600,
        });
    }
}