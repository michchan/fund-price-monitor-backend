#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { FundPriceMonitorBackendStack } from '../src/fund-price-monitor-backend-stack';

const app = new cdk.App();
new FundPriceMonitorBackendStack(app, 'FundPriceMonitorBackendStack');