#!/usr/bin/env node

const cdk = require('@aws-cdk/core');
const { AwsMetadataSampleStack } = require('../lib/aws-metadata-sample-stack');

const app = new cdk.App();
new AwsMetadataSampleStack(app, 'AwsMetadataSampleStack');
