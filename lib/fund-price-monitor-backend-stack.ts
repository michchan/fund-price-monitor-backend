import * as cdk from '@aws-cdk/core';
import { CronStack } from './cron';


export class FundPriceMonitorBackendStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Initialize cron jobs
        new CronStack(this);
    }
}
