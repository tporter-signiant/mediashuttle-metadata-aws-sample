const AWS = require('aws-sdk');
const querystring = require('querystring');
const ejs = require('ejs');
const crypto = require('crypto');

const { S3_BUCKET_NAME: Bucket, REGISTRATION_KEY: registrationKey } = process.env;

const generateSignedUrl = (requestUrl, requestBody) => {
    const requestTimestamp = new Date().toISOString();

    // Generate canonical query string
    const algorithmParam = 'X-Sig-Algorithm=SIG1-HMAC-SHA256';
    const dateParam = `X-Sig-Date=${requestTimestamp}`;
    const canonicalQueryString = `${querystring.escape(algorithmParam)}&${querystring.escape(dateParam)}`;

    // Generate the string to sign
    const requestBodyHash = crypto.createHash('sha256').update(requestBody).digest('hex');
    const stringToSign = `${requestTimestamp}\n${requestUrl}\n${canonicalQueryString}\n${requestBodyHash}`;

    // Generate the signing key
    let hmac = crypto.createHmac('sha256', registrationKey);
    const signingKey = hmac.update(requestTimestamp).digest();

    // Generate request signature
    hmac = crypto.createHmac('sha256', signingKey);
    const signature = hmac.update(stringToSign).digest('hex');

    // Generate the signed URL
    const signatureParam = `X-Sig-Signature=${signature}`;
    return `${requestUrl}?${algorithmParam}&${dateParam}&${signatureParam}`;
};

exports.handler = async (event) => {
    const { rawPath: path, body, isBase64Encoded } = event;

    // Return the metadata form when the request url is https://{api-url}/form
    if (path === '/form') {
        // Fetch the metadata HTML form template from S3.
        const s3 = new AWS.S3();
        const { Body } = await s3
            .getObject({
                Bucket,
                Key: 'form.html',
            })
            .promise();
        const formHtmlTemplate = Body.toString('utf8');

        // Extract the redirect URL passed by Media Shuttle in the request body. This is saved in the form as a hidden
        // form variable and used during form processing to return a response back to Media Shuttle.
        const formRequestBody = isBase64Encoded ? Buffer.from(body, 'base64').toString('utf8') : body;
        const { redirectUrl } = querystring.parse(formRequestBody);

        // Generate the final form HTML file using the form HTML template fetched from S3 above with the redirectUrl
        // placeholder expanded with redirectUrl passed by Media Shuttle.
        const formHtml = ejs.render(formHtmlTemplate, { redirectUrl });

        // Return the metadata form for Media Shuttle to display.
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/html' },
            body: formHtml,
        };
    }

    // Process the metadata form submission when the request url is https://{api-url}/processForm
    if (path === '/processForm') {
        const formSubmissionBody = isBase64Encoded ? Buffer.from(body, 'base64').toString('utf8') : body;
        const { redirectUrl } = querystring.parse(formSubmissionBody);
        const signedUrl = generateSignedUrl(redirectUrl, formSubmissionBody);

        return {
            statusCode: 307,
            headers: { Location: signedUrl },
        };
    }

    return { status: 404 };
};
