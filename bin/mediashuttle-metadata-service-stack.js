const path = require('path');
const { Stack, CfnOutput } = require('@aws-cdk/core');
const { Function, Runtime, Code } = require('@aws-cdk/aws-lambda');
const { HttpApi, LambdaProxyIntegration } = require('@aws-cdk/aws-apigatewayv2');
const { Bucket } = require('@aws-cdk/aws-s3');
const { BucketDeployment, Source } = require('@aws-cdk/aws-s3-deployment');

// Media Shuttle Submit portal Registration key used to sign requests
const REGISTRATION_KEY = '<Insert Your Media Shuttle Submit Portal Metadata Registration Key Here>';

// The S3 bucket name where the Lambda function retrieves the static HTML form template from
const S3_BUCKET_NAME = '<Insert Your S3 Bucket Name Here>';

class MediaShuttleMetadataServiceStack extends Stack {
    /**
     *
     * @param {cdk.Construct} scope
     * @param {string} id
     * @param {cdk.StackProps=} props
     */
    constructor(scope, id, props) {
        super(scope, id, props);

        // Lambda function that responds to HTTP requests to fetch and process the metadata form.
        const metadataLambda = new Function(this, 'MediaShuttleMetadataHandler', {
            runtime: Runtime.NODEJS_12_X,
            code: Code.fromAsset(path.join(__dirname, '../deploy/lambda/function.zip')),
            handler: 'index.handler',
            environment: {
                REGISTRATION_KEY,
                S3_BUCKET_NAME,
            },
        });

        // API Gateway HTTP endpoint that proxies metadata requests to the lambda function.
        const metadataHttpApi = new HttpApi(this, 'MediaShuttleMetadataEndpoint', {
            defaultIntegration: new LambdaProxyIntegration({
                handler: metadataLambda,
            }),
        });

        // S3 bucket for storing the metadata HTML form template that the lambda fetches/injects data into and returns.
        const metadataBucket = new Bucket(this, 'MediaShuttleMetadataBucket', {
            bucketName: S3_BUCKET_NAME,
        });

        // Grant the lambda function read permissions on the S3 bucket.
        metadataBucket.grantRead(metadataLambda);

        // The metadata HTML form template.
        new BucketDeployment(this, 'MediaShuttleMetadataForm', {
            sources: [Source.asset(path.join(__dirname, '../assets'))],
            destinationBucket: metadataBucket,
        });

        // Cloud formation template outputs.
        new CfnOutput(this, 'Lambda Function', { value: metadataLambda.functionArn });
        new CfnOutput(this, 'S3 Bucket', { value: metadataBucket.bucketArn });
        new CfnOutput(this, 'Metadata HTTP API Base Url', { value: metadataHttpApi.url });
    }
}

module.exports = MediaShuttleMetadataServiceStack;
