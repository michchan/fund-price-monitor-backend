import * as cdk from '@aws-cdk/core';
import cron from './services/cron';
import api from './services/api';
import logging from './services/logging';


export class FundPriceMonitorBackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Initialize cron service
    cron.init(this);
    // Initialize API service
    api.init(this);
    // Initialize logging service
    logging.init(this);
  }
}
