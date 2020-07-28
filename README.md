# Media Shuttle Metadata Sample Using AWS

A sample project demonstrating the basics of setting up a metadata collection form for a Media Shuttle Submit portal
using Amazon Web Services (AWS).

## Architecture

![architecture](img/architecture.png)

The sample uses a simple web service pattern where an API Gateway registering an HTTP API endpoint proxies
incoming requests to a backing Lambda function for processing. The Lambda function also makes use of a static
HTML template file stored in an S3 bucket.

## Getting Started

This sample project includes a fully deployable sample web service that can be deployed to your AWS account
using the AWS CDK after replacing two placeholder variables in `bin/mediashuttle-metadata-service-stack.js` 

1. Replace the placeholder value of the `REGISTRATION_KEY` variable with the registration key generated for your Submit
portal. The registration key can be generated and retrieved from the Metadata configuration page in the Media Shuttle
portal admin console.
 
2. Replace the placeholder value of the `S3_BUCKET_NAME` variable with a bucket name of your choice where the sample
static HTML form template file will be deployed to and fetched by the lambda when requested by Media Shuttle.

### Installation and Deployment

`npm run build` - prepares the project for deployment

`npm run deploy` - deploys CDK stack to your default AWS account/region
