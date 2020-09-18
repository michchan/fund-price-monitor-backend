import * as cdk from '@aws-cdk/core';
import cron from './cron';
import api from './api';


export class FundPriceMonitorBackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Initialize cron jobs
    cron.init(this);
    // Initilaize API handling
    api.init(this);
  }
}
